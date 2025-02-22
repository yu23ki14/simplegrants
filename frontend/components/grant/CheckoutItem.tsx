import { FC, Fragment, useMemo } from "react"
import Divider from "../Divider"
import Image from "next/image"
import { GrantCheckoutItem } from "../../utils/store/grant/grantCart"
import TextInput from "../input/TextInput"

type Props = {
  grant: GrantCheckoutItem
  handleAmountChange: (id: string, amount: string) => void
  removeFromCart: (id: string) => void
  initialMatchingAmount?: { [key: string]: number }
  matchingAmount?: { [key: string]: number }
}

export const GrantCheckoutListItem: FC<Props> = ({
  grant,
  handleAmountChange,
  removeFromCart,
  initialMatchingAmount,
  matchingAmount,
}) => {
  const matchedAmount = useMemo(() => {
    if (!initialMatchingAmount || !matchingAmount) return

    const amount =
      (matchingAmount?.[grant.id] || 0) -
      (initialMatchingAmount?.[grant.id] || 0)
    if (amount < 0) {
      return 0
    } else {
      return Math.round(amount)
    }
  }, [grant, initialMatchingAmount, matchingAmount])

  return (
    <Fragment key={grant.id}>
      <div
        className="flex flex-col md:flex-row w-full h-full items-center justify-between gap-y-6 md:gap-x-6"
        key={grant.id}
      >
        <div className="overflow-hidden rounded-lg flex-none md:max-w-[132px]">
          <Image
            src={grant.image}
            width={384}
            height={288}
            className="aspect-[5/4] object-cover"
            alt={grant.name}
          />
        </div>
        <div className="flex flex-col h-full justify-between flex-auto gap-y-2 md:gap-y-4 items-center md:items-start">
          <p className="font-bold text-lg h-full">{grant.name}</p>
          <div className="flex flex-col md:flex-row items-center gap-x-3">
            <div className="flex flex-row items-center">
              <TextInput
                value={grant.amount.toString().replace(/^0(?=\d)/, "")}
                type="number"
                placeholder="Amount"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  // updateGrantAmount(grant.id, event.target.value)
                  handleAmountChange(grant.id, event.target.value)
                }
                className="py-2 max-w-[120px] lg:max-w-[140px] text-lg"
                step="100" //日本円を100円単位でしか寄付できないようにする
              />
              <p className="text-sm ml-3">円</p>
            </div>
          </div>
          <div className="flex flex-col">
            <p className="text-sm text-gray-600">
              資金プールからのマッチング金額:{" "}
              <span className="text-lg font-bold">
                {typeof matchedAmount !== "undefined"
                  ? matchedAmount.toLocaleString()
                  : "計算中..."}{" "}
                円
              </span>
            </p>
          </div>
        </div>
        <p
          className="cursor-pointer h-full items-center justify-center text-sg-error text-sm w-10 text-right"
          onClick={() => removeFromCart(grant.id)}
        >
          削除
        </p>
      </div>
    </Fragment>
  )
}
