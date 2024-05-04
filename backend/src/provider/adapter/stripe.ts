import { GrantWithFunding } from 'src/grants/grants.interface';
import {
  PaymentProviderAdapter,
  PaymentProviderConstructorProps,
} from './types';
import Stripe from 'stripe';
import { PaymentProvider, User } from '@prisma/client';
import * as cuid from 'cuid';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  HttpException,
  HttpStatus,
  Logger,
  LoggerService,
  Injectable,
} from '@nestjs/common';
import {
  FeeAllocationMethod,
  SuccessfulCheckoutInfo,
} from '../provider.interface';
import { PoolWithFunding } from 'src/pool/pool.interface';
import { QfService } from 'src/qf/qf.service'; // QfServiceをインポート

export interface PaymentIntentEventWebhookBody {
  id: string;
  object: string;
  api_version: string;
  created: number;
  data: {
    object: {
      id: string;
      object: string;
      last_payment_error: any;
      livemode: boolean;
      next_action: any;
      status: string;
      amount: number;
      amount_capturable: number;
      amount_details: {
        tip: any;
      };
      amount_received: number;
      application: any;
      application_fee_amount: any;
      automatic_payment_methods: any;
      canceled_at: any;
      cancellation_reason: any;
      capture_method: string;
      client_secret: string;
      confirmation_method: string;
      created: number;
      currency: string;
      customer: any;
      description: any;
      invoice: any;
      latest_charge: string;
      metadata: {
        userId: string;
        denomination: string;
        type: 'grant' | 'pool';
      };
      on_behalf_of: any;
      payment_method: string;
      payment_method_options: {
        card: {
          installments: any;
          mandate_options: any;
          network: any;
          request_three_d_secure: string;
        };
      };
      payment_method_types: string[];
      processing: any;
      receipt_email: any;
      review: any;
      setup_future_usage: any;
      shipping: any;
      source: any;
      statement_descriptor: any;
      statement_descriptor_suffix: any;
      transfer_data: any;
      transfer_group: string;
    };
  };
  livemode: boolean;
  pending_webhooks: number;
  request: { id: any; idempotency_key: any };
  type: string;
}

@Injectable()
export class StripeProvider implements PaymentProviderAdapter {

  // private qfService: QfService; // QfServiceのプロパティを追加

  constructor(constructorProps: PaymentProviderConstructorProps) {
    const { prisma, secret, country, qfService } = constructorProps;

    this.prisma = prisma;
    this.country = country;
    this.stripe = new Stripe(secret, {
      apiVersion: '2022-11-15',
    });
    this.qfService = qfService; // QfServiceを初期化
  }

  private prisma: PrismaService;
  private country: string;
  private stripe: Stripe;
  private logger: LoggerService = new Logger(StripeProvider.name);
  // Technically a payment provider should never be updated during runtime
  // so we can save and cache information about the payment provider in the class itself
  private qfService: QfService;

  /**
   * Rounds a number to two decimal places
   * @param num Number to round
   * @returns Number rounded to 2 decimal places
   */
  roundNumber(num: number): number {
    // Using epsilon for precision errors
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  /**
   * TODO: Perhaps find a way to dynamically change Stripe fees based on country
   * Right now it is hardcoded to the US fees of 2.9% + 30c
   * @param amount
   * @returns The Stripe fees needed to be added in to the total payment amount
   */
  getCustomerFee(amount: number): number {
    const fixedFee = 0.3;
    const percentFee = 0.029;

    return this.roundNumber((amount + fixedFee) / (1 - percentFee) - amount);
  }

  /**
   * TODO: Perhaps find a way to dynamically change Stripe fees based on country
   * Right now it is hardcoded to the US fees of 2.9% + 30c
   * @param amount
   * @param feeAllocation
   * @param totalAmount
   * @returns A lookup table for the amount each grant should receive.
   * Minus Stripe fees if `feeAllocation` is `PASS_TO_ENTITY`
   */
  getTransferAmount(
    items: (GrantWithFunding | PoolWithFunding)[],
    feeAllocation: FeeAllocationMethod,
    totalAmount: number,
  ): { [key: string]: number } {
    const fixedFee = 0.3;
    const percentFee = 0.029;
    const totalFee = totalAmount * percentFee + fixedFee;

    // If the fee allocation method is to pass to grant, we calculate the amount after fees
    return items.reduce((acc, item) => {
      acc[item.id] =
        feeAllocation === FeeAllocationMethod.PASS_TO_ENTITY
          ? this.roundNumber(
              item.amount - (item.amount / totalAmount) * totalFee,
            )
          : item.amount;
      return acc;
    }, {});
  }

  /**
   * We can assume that in v1, we can only have 1 payment provider
   * @returns Default payment provider
   */
  async getDetails(): Promise<PaymentProvider> {
    return await this.prisma.paymentProvider.findFirst();
  }

  /**
   * Initiate a payment process with Stripe for grants
   * @param grantWithFunding
   * @param user
   * @returns
   */
  async createGrantPayment(
    grantWithFunding: GrantWithFunding[],
    feeAllocation: FeeAllocationMethod,
    user: User,
  ) {
    const provider = await this.getDetails();
    const transferGroup = cuid();
    const totalDonation = grantWithFunding.reduce(
      (acc, grant) => acc + grant.amount,
      0,
    );
    const grantAmountLookup = this.getTransferAmount(
      grantWithFunding,
      feeAllocation,
      totalDonation,
    );

    //  'grantWithFunding'は、資金提供を受ける各助成金の詳細情報を含む配列です。この関数は、それに対応するマッチングラウンドIDを取得します。
    const matchingRoundId = await this.getMatchingRoundIdForGrants(grantWithFunding); //getMatchingRoundIdForGrants関数を呼び出して、与えられた'getwithFunding'に対応するマッチングラウンドIDを取得




    // const qfAmounts = await this.qfService.calculateQuadraticFundingAmount(matchingRoundId);

    // // MatchedFundテーブルに上乗せ金額を保存
    // await this.saveMatchedFunds(qfAmounts, matchingRoundId);

    for await (const grant of grantWithFunding) {
      if (grant.amount > 0) {

        // Contribution テーブルにデータを保存
        await this.prisma.contribution.create({
          data: {
            userId: user.id,
            amount: grantAmountLookup[grant.id],
            denomination: provider.denominations[0],
            amountUsd: grantAmountLookup[grant.id], // USD換算が必要な場合は変換ロジックを追加
            grantId: grant.id,
            flagged: false, // デフォルトは false, 特定の条件で true に設定
            paymentMethodId: 'clg3bs740000kx6s51e9fe8lu', // PaymentMethodId は Checkout の ID として仮置き
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // const qfAmount = await this.qfService.calculateQuadraticFundingAmount(matchingRoundId);


        // // `MatchedFund`テーブルを検索し、すでに同じgrantIdがあるかどうかを判定
        // const existingMatchedFund = await this.prisma.matchedFund.findUnique({
        //   where: {
        //     matchingRoundId_grantId: {
        //       matchingRoundId: matchingRoundId, // このマッチングラウンドIDを取得する必要があります
        //       grantId: grant.id,
        //     },
        //   },
        // });

        // if (existingMatchedFund) {
        //   // 既存のレコードが見つかった場合、amountを更新
        //   await this.prisma.matchedFund.update({
        //     where: {
        //       id: existingMatchedFund.id,
        //     },
        //     data: {
        //       amount: qfAmount.grants[grant.id].qfAmount,
        //       amountUsd: qfAmount.grants[grant.id].qfAmount,
        //     },
        //   });
        // } else {
        //   // レコードが存在しない場合、MatchedFundテーブルにデータを保存する
        //   await this.prisma.matchedFund.create({
        //     data: {
        //       matchingRoundId: matchingRoundId, //matchingRoundId関数は寄付したプロジェクトが属しているマッチングラウンドのIDを返す
        //       grantId: grant.id, // 寄付したプロジェクトのgrantId
        //       amount: qfAmount.grants[grant.id].qfAmount, //本来は、上乗せ金額を計算して入れる
        //       denomination: "JPY", //固定
        //       amountUsd: qfAmount.grants[grant.id].qfAmount, //
        //       payoutAt: new Date(),
        //     },
        //   });
        // }

        // 寄付が行われた際に呼び出される関数内で以下の処理を追加
        await this.qfService.handleMatchedFunds(matchingRoundId, grant.id); //Cannot read properties of undefined (reading 'handleMatchedFunds')というエラーが出てる


      }
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        ...grantWithFunding.map((grant) => {
          return {
            price_data: {
              currency: provider.denominations[0],
              product_data: {
                name: grant.name,
                description:
                  grant.description.length > 80
                    ? grant.description.slice(0, 80) + '...'
                    : grant.description,
              },
              unit_amount: grant.amount, // JPYを扱うのでMath.round()の削除
            },
            quantity: 1,
          };
        }),
        feeAllocation === FeeAllocationMethod.PASS_TO_CUSTOMER
          ? {
              price_data: {
                currency: provider.denominations[0],
                product_data: {
                  name: 'Stripe Fees',
                  description: 'Processing fees taken by Stripe',
                },
                unit_amount: this.getCustomerFee(totalDonation),
              },
              quantity: 1,
            }
          : undefined,
      ],
      payment_intent_data: {
        transfer_group: transferGroup,
        metadata: {
          userId: user.id,
          denomination: provider.denominations[0],
          type: 'grant',
        },
      },
      success_url: `${process.env.FRONTEND_URL}/grants/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/grants/checkout`,
    });

    return session;
  }


  // // 与えられたグラントに対応するマッチングラウンドIDを取得するメソッド
  async getMatchingRoundIdForGrants(grantWithFunding: GrantWithFunding[]): Promise<string> {
    if (grantWithFunding.length > 0) {
      const grantId = grantWithFunding[0].id;
      const matchingRound = await this.prisma.matchingRound.findFirst({
        where: {
          grants: {
            some: {
              id: grantId,
            },
          },
        },
      });
      if (matchingRound) {
        return matchingRound.id;
      } else {
        throw new Error('Matching round not found for the provided grant');
      }
    }
    throw new Error('No grants provided');
  }



  /**
   * Initiate a payment process with Stripe for pools
   * @param poolWithFunding
   * @param user
   * @returns
   */
  async createPoolPayment(
    poolWithFunding: PoolWithFunding[],
    feeAllocation: FeeAllocationMethod,
    user: User,
  ) {
    const provider = await this.getDetails();
    const transferGroup = cuid();
    const totalDonation = poolWithFunding.reduce(
      (acc, pool) => acc + pool.amount,
      0,
    );

    const poolAmountLookup = this.getTransferAmount(
      poolWithFunding,
      feeAllocation,
      totalDonation,
    );

    for await (const pool of poolWithFunding) {
      if (pool.amount > 0) {
        await this.prisma.checkout.create({
          data: {
            user: {
              connect: {
                id: user.id,
              },
            },
            amount: poolAmountLookup[pool.id],
            denomination: provider.denominations[0],
            matchingRound: {
              connect: {
                id: pool.id,
              },
            },
            groupId: transferGroup,
          },
        });
      }
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        ...poolWithFunding.map((pool) => {
          return {
            price_data: {
              currency: provider.denominations[0],
              product_data: {
                name: pool.name,
                description:
                  pool.description?.length > 80
                    ? pool.description.slice(0, 80) + '...'
                    : pool.description || undefined,
              },
              unit_amount: pool.amount, // JPYを扱うのでMath.round()の削除
            },
            quantity: 1,
          };
        }),
        feeAllocation === FeeAllocationMethod.PASS_TO_CUSTOMER
          ? {
              price_data: {
                currency: provider.denominations[0],
                product_data: {
                  name: 'Stripe Fees',
                  description: 'Processing fees taken by Stripe',
                },
                unit_amount: this.getCustomerFee(totalDonation),
              },
              quantity: 1,
            }
          : undefined,
      ],
      payment_intent_data: {
        transfer_group: transferGroup,
        metadata: {
          userId: user.id,
          denomination: provider.denominations[0],
          type: 'pool',
        },
      },
      success_url: `${process.env.FRONTEND_URL}/pools/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pools/checkout`,
    });

    return session;
  }

  async initiateTransfer(to: string, amount: number): Promise<any> {
    const provider = await this.getDetails();
    const transfer = await this.stripe.transfers.create({
      amount: amount, // 日本円の場合はそのまま渡す
      currency: provider.denominations[0],
      destination: to,
    });

    return transfer;
  }

  /**
   * We need to retrieve all checkout items tied to the specific transfer_group
   * Also need to retrieve & store the payment method to the table
   * Then we create a transfer for each item, and save the info into contributions
   * @param data
   */
  async handleWebhook(body: PaymentIntentEventWebhookBody): Promise<void> {
    const paymentProvider = await this.getDetails();
    const data = body.data.object;

    if (body.type != 'payment_intent.succeeded') return;
    this.logger.log('Received webhook for successful payment intent!');

    /**
     * Retrieve payment method
     */
    const stripePaymentMethod = await this.stripe.paymentMethods.retrieve(
      data.payment_method,
    );

    this.logger.log('Payment Method retrieved from Stripe!');
    /**
     * Save the payment method to the user
     * If the user already has a payment method, we update it.
     * Only if we find another user with the same payment fingerprint, we flag the account
     *
     * We also assume they will pay by card
     * TODO: Check for same payment fingerprint and flag the accounts
     */
    const userPaymentMethod = await this.prisma.paymentMethod.upsert({
      create: {
        uniqueId: stripePaymentMethod.card.fingerprint,
        displayInfo: stripePaymentMethod.card.last4,
        denomination: data.metadata.denomination,
        provider: {
          connect: {
            id: paymentProvider.id,
          },
        },
        metadata: {
          ...stripePaymentMethod.card,
        } as any,
        user: {
          connect: {
            id: data.metadata.userId,
          },
        },
      },
      update: {},
      where: {
        uniqueId: stripePaymentMethod.card.fingerprint,
      },
    });

    await this.prisma.user.update({
      data: {
        paymentMethods: {
          connect: {
            id: userPaymentMethod.id,
          },
        },
      },
      where: {
        id: data.metadata.userId,
      },
    });

    this.logger.log('User payment method saved!');
    this.logger.log('Retrieving checkout items...');

    /**
     * Create transfers
     */
    const transferGroup = data.transfer_group;
    const checkoutsToProcess = await this.prisma.checkout.findMany({
      where: {
        groupId: transferGroup,
      },
      include: {
        grant: {
          include: {
            paymentAccount: true,
          },
        },
        matchingRound: true,
      },
    });

    this.logger.log(`${checkoutsToProcess.length} items to process`);

    /**
     * We only need to do transfers if its a checkout to grants
     */
    if (data.metadata.type === 'grant') {
      this.logger.log('Creating transfers...');

      for await (const checkout of checkoutsToProcess) {
        await this.stripe.transfers.create({
          amount: checkout.amount, // 日本円の場合はそのまま渡す
          currency: checkout.denomination,
          destination: checkout.grant.paymentAccount.recipientAddress,
          transfer_group: transferGroup,
        });
      }

      this.logger.log('Transfers made!');

      /**
       * Store contributions
       */
      await this.prisma.contribution.createMany({
        data: checkoutsToProcess.map((checkout) => {
          return {
            userId: data.metadata.userId,
            amount: checkout.amount,
            denomination: checkout.denomination,
            amountUsd: checkout.amount,
            paymentMethodId: userPaymentMethod.id,
            grantId: checkout.grantId,
            flagged: false,
          };
        }),
      });
    } else {
      /**
       * Store contributions
       */
      await this.prisma.contribution.createMany({
        data: checkoutsToProcess.map((checkout) => {
          return {
            userId: data.metadata.userId,
            amount: checkout.amount,
            denomination: checkout.denomination,
            amountUsd: checkout.amount,
            paymentMethodId: userPaymentMethod.id,
            matchingRoundId: checkout.matchingRoundId,
            flagged: false,
          };
        }),
      });
    }

    this.logger.log('Contributions saved to database!');
    this.logger.log('Webhook run complete ✅');
  }

  async retrieveCheckoutInfo(
    sessionId: string,
  ): Promise<SuccessfulCheckoutInfo> {
    try {
      const data = await this.stripe.checkout.sessions.listLineItems(sessionId);
      const checkoutInfo = data.data.reduce(
        (acc, item) => {
          if (item.description !== 'Stripe Fees') {
            acc.donated += item.amount_total;
            acc.numberOfItems += 1;
          }
          return acc;
        },
        { donated: 0, matched: 0, numberOfItems: 0 },
      );

      return checkoutInfo;
    } catch (err) {
      this.logger.error(err);
      throw new HttpException(
        'Unable to retrieve checkout session',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
