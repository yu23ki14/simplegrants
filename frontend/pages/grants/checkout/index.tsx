/* eslint-disable react-hooks/exhaustive-deps */
import Head from "next/head";
import { useSession } from "next-auth/react";
// import React from "react";
import MainLayout from "../../../layouts/MainLayout";
import Navbar from "../../../layouts/Navbar";
import Button from "../../../components/Button";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useGrantCartStore } from "../../../utils/store";
import Divider from "../../../components/Divider";
import { useHasHydrated } from "../../../utils/useHydrated";
import TextInput from "../../../components/input/TextInput";
import axios from "../../../utils/axios";
import { toast } from "react-toastify";
import BackButton from "../../../components/BackButton";

import React, { useState, useEffect } from 'react';
// import fetchMatchingAmountEstimate from "./success" //consoleで推定マッチング額を表示するためにimport
// import { number } from "zod";

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ChartData {
  [key: string]: { x: number; y: number }[];
}


const fetchMatchingAmountEstimate = async (donationAmount: number, grantId: string): Promise<any> => {
  try {
    const response = await axios.get(`http://localhost:3000/qf/estimate?donationAmount=${donationAmount}&grantId=${grantId}`);
    return response.data; // マッチング金額の見積もりが返される
  } catch (error) {
    console.error('マッチング金額の見積もり取得エラー:', error);
    return 0; // エラーが発生した場合は0を返す
  }
};



export default function GrantsCheckout() {
  const router = useRouter();
  const { grants, addToCart, removeFromCart, updateCart } = useGrantCartStore();
  const { id } = router.query;
  // const { data: session, status } = useSession();
  // const [data, setData] = React.useState<any>();
  const { data: session, status } = useSession();
  const [checkoutData, setCheckoutData] = React.useState<any>();
  const [loading, setLoading] = React.useState(false);
  const hasHydrated = useHasHydrated();

  // chartData の状態をここで定義
  const [chartData, setChartData] = useState<ChartData>({});

  // const [chartData, setChartData] = React.useState({});
  React.useEffect(() => {
    const fetchInitialData = async () => {
      const allChartData: Record<string, { x: number; y: number }[]> = {};
      for (const grant of grants) {
        const dataPoints: { x: number; y: number }[] = [];
        for (let amount = 0; amount <= 2000; amount += 100) {
          const matchingAmount = await fetchMatchingAmountEstimate(amount, grant.id);
          dataPoints.push({ x: amount, y: matchingAmount });
        }
        allChartData[grant.id] = dataPoints;
      }
      setChartData(allChartData);
    };

    if (grants.length > 0) {
      fetchInitialData();
    }
  }, [grants]);

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/sign-in");
    }
  }, [status]);

  React.useEffect(() => {
    if (checkoutData) {
      router.push(checkoutData.url);
    }
  }, [checkoutData]);

  const subtotal = React.useMemo(
    () => grants.reduce((acc, grant) => acc + grant.amount, 0),
    [grants]
  );

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await axios.post("/grants/checkout", {
        grants: grants.map(grant => ({ id: grant.id, amount: grant.amount })),
      }, { withCredentials: true });
      setCheckoutData(response.data);
      sessionStorage.setItem('projectIds', JSON.stringify(grants.map(grant => grant.id)));
      // マッチング金額をセッションストレージに保存
      sessionStorage.setItem('totalMatchingAmount', totalMatchingAmount.toString());
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = async (id: string, amount: string) => {
    const num = parseFloat(amount);
    if (isNaN(num) || num < 0) {
      updateCart(id, 0);
    } else {
      updateCart(id, num);

      //ユーザーが金額を入力するたびに、マッチング金額の見積もりを取得
      try {
        const matchingAmount = await fetchMatchingAmountEstimate(num, id);
        console.log(`推定マッチング額: ${matchingAmount}`);
      } catch (error) {
        console.error('Error fetching matching amount:', error);
      }
    }
  };

  const chartOptions = {
    scales: {
      x: {
        type: 'linear' as const,
        min: 0,
        max: 2000,
        title: {
          display: true,
          text: '寄付額'
        }
      },
      y: {
        title: {
          display: true,
          text: 'マッチング'
        }
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },

    plugins: {
      legend: {
      labels: {
        font: {
          size: 12 // ラベルのフォントサイズを小さく設定
        }
      }
    },
      tooltip: {
        enabled: true,
        intersect: false,
        caretPadding: 100,
        callbacks: {
          label: function (context: any) {

            // const roundedY = Math.round(context.parsed.y).toLocaleString('ja-JP');
            // const formattedX = context.parsed.x.toLocaleString('ja-JP');
            // return `¥${formattedX}寄付すると、¥${roundedY}マッチングされます`;
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    aspectRatio: 2 // アスペクト比を2に設定
  };

  // const generateChartData = (id: string, amount: string) => {
  //   const num = parseFloat(amount);

  //   const dataPoints = chartData[id] || [];

  //   // const sampleDataPoints = [
  //   //   { x: 0, y: 0 },
  //   //   { x: 100, y: 20 },
  //   //   { x: 200, y: 50 },
  //   //   { x: 300, y: 75 },
  //   //   { x: 400, y: 95 },
  //   //   { x: 500, y: 110 }
  //   // ];
  //   return {
  //     datasets: [{
  //       label: 'マッチング金額のシミュレーション',
  //       // data: sampleDataPoints,
  //       data: dataPoints,
  //       pointRadius: 5,

  //       pointBackgroundColor: dataPoints.map(dp => dp.x === num ? 'red' : 'rgba(0, 0, 255, 0.5)'), // 寄付額と一致する��を赤色にする
  //     }]
  //   };
  // }

  const generateCombinedChartData = () => {
    const datasets = grants.map((grant, index) => {
      const color = colors[index % colors.length]; // 色のリストから循環的に色を選択
      const dataPoints = chartData[grant.id] || [];
      return {
        label: `${grant.name} `, //各プロジェクトの名前が入る
        data: dataPoints,
        pointRadius: dataPoints.map(dp => dp.x === grant.amount ? 5 : 0),
        borderColor: color,
        fill: false,
        // pointBackgroundColor: dataPoints.map(dp => dp.x === num ? 'red' : 'rgba(0, 0, 255, 0.5)'), // 寄付額と一致する点を赤色にする
        pointBackgroundColor: dataPoints.map(dp => dp.x === grant.amount ? 'red' : 'rgba(0, 0, 255, 0.5)'), // 寄付額と一致する点を赤色にする
      };
    });

    return { datasets };
  };

  const colors = [
    // '#FF4B00', // 鮮やかな黄みの赤
    '#005AFF', // 鮮やかな青
    '#03AF7A', // 重厚な青みの緑
    // '#4DC4FF', // シアン色
    '#F6AA00', // 鮮やかな黄みの橙
    '#FFF100', // 鮮やかな黄
    '#000000'  // 漆黒の黒色
  ];

  //推定マッチングがくの合計
  const totalMatchingAmount = React.useMemo(() => {
    return grants.reduce((acc, grant) => {
      const matchingAmount = chartData[grant.id]?.find(data => data.x === grant.amount)?.y || 0;
      return acc + matchingAmount;
    }, 0);
  }, [grants, chartData]);

  return (
    <div>
      <Head>
        <title>Checkout | SimpleGrantsCheckout</title>
        <meta
          name="description"
          content="Join us in making an impact through quadratic funding."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <MainLayout>
        <Navbar className="p-0" location="grants">
          <Link href="/grants/create">
            <Button>プロジェクト登録</Button>
          </Link>
        </Navbar>
        <div className="flex flex-col items-start justify-center px-8 my-2 w-full">
          <BackButton href="/grants">プロジェクト一覧へ戻る</BackButton>
          <h1 className="font-bold text-2xl my-10 px-4">カート内のプロジェクト</h1>
          <div className="w-full flex flex-col md:flex-row gap-y-8">
            <div className="basis-full md:basis-3/5 px-4">
              <div className="flex flex-col bg-white shadow-card py-8 px-6 rounded-xl gap-y-6">
                {hasHydrated &&
                  grants.map((grant, index) => (
                    <React.Fragment key={grant.id}>
                      <div
                        className="flex flex-row w-full h-full items-center justify-between gap-x-6"
                        key={grant.id}
                      >
                        <div className="overflow-hidden rounded-lg flex-none">
                          <Image
                            src={grant.image}
                            width={132}
                            height={98}
                            className="aspect-[5/4] object-cover"
                            alt={grant.name}
                          />
                        </div>
                        <div className="flex flex-col h-full justify-between flex-auto gap-y-6">
                          <p className="font-bold text-lg h-full">
                            {grant.name}
                          </p>
                          <div className="flex flex-row items-center">
                            <TextInput
                              value={grant.amount
                                .toString()
                                .replace(/^0(?=\d)/, "")}
                              type="number"
                              placeholder="Amount"
                              onChange={(
                                event: React.ChangeEvent<HTMLInputElement>
                              ) =>
                                // updateGrantAmount(grant.id, event.target.value)
                                handleAmountChange(grant.id, event.target.value)
                              }
                              className="px-4 py-2 max-w-[144px] lg:max-w-[192px] text-lg"
                              step="100"  //日本円を100円単位でしか寄付できないようにする
                            />
                            <p className="text-lg ml-3">円</p>
                          <div className="flex flex-col">
                            <p className="text-sm text-gray-600">マッチング金額:</p>
                            <p className="text-lg font-bold">
                              {chartData[grant.id] ? Math.round(chartData[grant.id].find(data => data.x === grant.amount)?.y || 0).toLocaleString() : '計算中...'} 円
                            </p>
                          </div>

                          </div>
                          {/* <Line data={generateChartData(grant.id, grant.amount.toString())} options={chartOptions} /> */}
                        </div>
                        <p
                          className="cursor-pointer h-full items-center justify-center text-sg-error"
                          onClick={() => removeFromCart(grant.id)}
                        >
                          削除
                        </p>
                      </div>
                      {index !== grants.length - 1 && (
                        <Divider
                          orientation="horizontal"
                          className="bg-sg-500"
                          key={index}
                        />
                      )}
                    </React.Fragment>
                  ))}
              </div>
            </div>
            <div className="basis-full md:basis-2/5 px-4 flex flex-col items-center ">
              {/* <div className="flex flex-col w-full bg-white shadow-card py-8 px-6 rounded-xl max-w-sm"> */}
              <div className="flex-1 bg-white shadow-card py-8 px-6 rounded-xl mb-4 chart-container">
                {/* <h2 className="font-bold text-xl mb-8">推定マッチング金額</h2>
                <Line data={generateCombinedChartData()} options={chartOptions} /> */}
                <h2 className="font-bold text-xl mb-4">推定マッチング金額</h2>
                <Line data={generateCombinedChartData()} options={{ ...chartOptions, aspectRatio: 2 }} />
              </div>
              <br></br>
              <div className="flex flex-col w-full bg-white shadow-card py-8 px-6 rounded-xl max-w-sm">
                <p className="font-bold text-xl mb-8">合計金額</p>
                <p className="font-bold text-lg mb-3">カートに入れたプロジェクト</p>
                <div className="flex flex-col mb-6 gap-y-3">
                  {hasHydrated &&
                    grants.map((grant) => (
                      <div
                        className="flex flex-row w-full items-center justify-between"
                        key={grant.id}
                      >
                        <div className="flex flex-1 justify-start overflow-hidden">
                          <p className="truncate">{grant.name}</p>
                        </div>
                        <p className="flex flex-1 text-ellipsis truncate justify-end">
                          {grant.amount.toLocaleString("ja-JP", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}{" "}
                          円
                        </p>
                      </div>
                    ))}
                </div>
                <Divider orientation="horizontal" className="bg-sg-700" />
                <div className="flex flex-row w-full items-center justify-between mt-6 mb-3">
                  <p className="flex flex-1 text-ellipsis truncate justify-start font-bold text-lg">
                    合計
                  </p>


                  <p className="flex flex-1 text-ellipsis truncate justify-end">
                    {hasHydrated &&
                      subtotal.toLocaleString("ja-JP", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}{" "}
                    円
                  </p>
                </div>
                <div className="flex flex-row w-full items-center justify-between mb-8">
                  <p className="flex text-ellipsis truncate justify-start text-lg">
                    資金プールからのマッチング
                  </p>
                  <p className="flex flex-1 text-ellipsis truncate justify-end">
                    +
                    {hasHydrated &&
                      totalMatchingAmount.toLocaleString("ja-JP", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}{" "}
                    円
                  </p>
                </div>
                <Button
                  onClick={handleCheckout}
                  width="full"
                  disabled={(hasHydrated && subtotal <= 1) || loading}
                >
                  寄付する
                </Button>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </div>
  );
}

