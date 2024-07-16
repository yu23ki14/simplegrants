import { FC } from "react"
import { Bar } from "react-chartjs-2"
import { GrantCheckoutItem } from "../../utils/store/grant/grantCart"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

type Props = {
  grants: GrantCheckoutItem[]
  initialMatchingAmount?: { [key: string]: number }
  matchingAmount?: { [key: string]: number }
}

export const QfBar: FC<Props> = ({
  grants,
  initialMatchingAmount,
  matchingAmount,
}) => {
  const chartOptions = {
    scales: {
      x: {
        title: {
          display: true,
          text: "プロジェクト",
        },
      },
      y: {
        title: {
          display: true,
          text: "金額",
        },
      },
    },
    interaction: {
      mode: "index" as const,
      intersect: false,
    },

    plugins: {
      legend: {
        labels: {
          font: {
            size: 12, // ラベルのフォントサイズを小さく設定
          },
        },
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
            let label = context.dataset.label || ""
            if (label) {
              label += ": "
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat("ja-JP", {
                style: "currency",
                currency: "JPY",
              }).format(context.parsed.y)
            }
            return label
          },
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    maxHeight: "300px",
  }

  return (
    <div style={{ height: "300px" }}>
      <Bar
        data={{
          labels: grants.map((grant) =>
            grant.name.length > 7 ? grant.name.slice(0, 7) + "..." : grant.name
          ),
          datasets: [
            {
              label: "あなたの寄付金額",
              data: grants.map((grant) => grant.amount),
              backgroundColor: "rgba(54, 162, 235, 0.2)",
              borderColor: "rgba(54, 162, 235, 1)",
              borderWidth: 1,
            },
            {
              label: "資金プールからのマッチング金額",
              data: grants.map((grant) => {
                if (!initialMatchingAmount || !matchingAmount) return 0

                const amount =
                  (matchingAmount?.[grant.id] || 0) -
                  (initialMatchingAmount?.[grant.id] || 0)
                if (amount < 0) {
                  return 0
                } else {
                  return Math.round(amount)
                }
              }),
              backgroundColor: "rgba(255, 99, 132, 0.2)",
              borderColor: "rgba(255, 99, 132, 1)",
              borderWidth: 1,
            },
          ],
        }}
        options={chartOptions}
      />
    </div>
  )
}
