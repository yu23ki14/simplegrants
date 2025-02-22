import Head from "next/head"
import { useSession } from "next-auth/react"
import { useVisitorData } from "@fingerprintjs/fingerprintjs-pro-react"
import React from "react"
import Image from "next/image"
import LandingNavbar from "../layouts/landing/LandingNavbar"
import Button from "../components/Button"
import { useRouter } from "next/router"
import { ArrowTopRightIcon } from "@radix-ui/react-icons"
import GrantCard from "../components/grant/GrantCard"
import { GrantResponse } from "../types/grant"
import axios from "../utils/axios"
import { toast } from "react-toastify"
import Fade from "react-reveal/Fade"
import Github from "../components/icons/Github"
import Twitter from "../components/icons/Twitter"
import Link from "next/link"

const nl2br = (str: string) => {
  return str.split('\n').map((line, i) => (
    <React.Fragment key={i}>
      {line}
      {i !== str.split('\n').length - 1 && <br />}
    </React.Fragment>
  ));
};


const testimonials = [
  {
    name: "関 治之",
    title: "Code for Japan",
    image: "https://pbs.twimg.com/profile_images/1417298617132486657/4AL2yixW_400x400.jpg",
    comment: "マッチングドネーションは、より多くの人の価値観を反映するための新たな参加形寄付方式です。\nこれにより、自治体内での審査プロセスは短縮し、より民主的な方法で資金を分配できるようになりました。",
  },
  {
    name: "奥村春香",
    title: "第3の家族",
    image: "https://pbs.twimg.com/profile_images/1596524266308374528/8Pc4BgOt_400x400.jpg",
    comment: "第3の家族は中学生〜大学生向けのサービス、かつ親や学校がステークホルダーにないサービスなので、支持者が他の団体に比べると若く、寄付額が少ないことが悩みでした。\n取り組みによって、支援してくれる人の所得帯が異なることは課題感として感じていたので、本当に今回のマッチングドネーションの取り組みに私たちも希望を感じています。",
  },
  {
    name: "白取 耕一郎",
    title: "支援みつもりヤドカリくん",
    image: "https://i.gyazo.com/756c60efb14b1987e4b0b25a40d28aa5.jpg",
    comment: "市民活動にもお金は必要です。特にアプリ開発のように費用も時間も多くかかりがちな分野では特にそうだと思います。ずっと持ち出しで活動していると息切れする率が高くなると感じます。\nQFのような仕組みなら、政府や民間財団が集権的に決めなくても、関心の高い市民が意思決定に加わればデジタル公共財が供給できます。",
  },
  // 他の証言を追加...
];


export default function Home() {
  const { data: session } = useSession()
  const router = useRouter()
  const [data, setData] = React.useState<GrantResponse[]>([])
  const [loading, setLoading] = React.useState(false)
  const { getData } = useVisitorData({ tag: "signin" }, { immediate: false })

  React.useEffect(() => {
    const saveFingerprintData = async () => {
      getData().then((res) => {
        fetch("/api/user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            user: res.visitorId,
          }),
        })
      })
    }

    if (session) {
      saveFingerprintData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const getGrants = () => {
    setLoading(true)
    axios
      .get("/grants")
      .then((res) => setData(res.data))
      .catch((err) => {
        console.error({ err })
        toast.error(
          err.response?.data?.message || err.message || "Something went wrong",
          {
            toastId: "retrieve-grants-error",
          }
        )
      })
      .finally(() => setLoading(false))
  }

  React.useEffect(() => {
    getGrants()
  }, [])

  return (
    <div>
      <Head>
        <title>DigDAOマッチングドネーション</title>
        <meta
          name="description"
          content="マッチングドネーション（Quadratic Funding）でお気に入りのプロジェクトに寄付して、公共財を支援しよう"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col min-w-screen min-h-screen w-full h-full overflow-x-hidden bg-white">
        <LandingNavbar className="z-[2] absolute top-0 left-0" />
        <div className="flex flex-col w-full items-center justify-center min-h-[80vh] text-center bg-sg-primary px-2">
          <Fade bottom distance="15px">
            <h1 className="font-bold text-3xl md:text-5xl max-w-2xl md:leading-snug">
              助成金の分配先を自分たちの寄付で決める!
            </h1>
            <p className="mt-3 text-lg md:text-xl">
              マッチングドネーション（Quadratic
              Funding）でお気に入りのプロジェクトに寄付して、公共財を支援しよう
            </p>
            <div className="flex flex-col sm:flex-row justify-center mt-8 gap-4">
              <Button
                style="outline"
                className="bg-white text-black border-2 border-black py-2 px-6 hover:bg-gray-100 transition-colors duration-300 rounded-none"
                onClick={() => window.open('https://note.com/tkgshn/n/nfa5142139665', '_blank')}
              >
                第一回目の実験結果を見る
              </Button>
              <Button
                className="bg-black text-white py-2 px-6 hover:bg-gray-800 transition-colors duration-300 rounded-none"
                onClick={() => window.open('https://twitter.com/intent/follow?screen_name=digdaox', '_blank')}
              >
                最新情報を受け取る
              </Button>
            </div>
          </Fade>
        </div>
        <div className="relative flex w-full -translate-y-[57%]">
          <Image
            src="/assets/abstract.svg"
            width={1920}
            height={384}
            alt="abstract"
            className="scale-200 md:scale-150 lg:scale-125 w-screen"
          />
        </div>


        <div className="relative flex flex-col items-center w-full md:-translate-y-[30%] translate-y-10">
          <h2 className="font-bold text-3xl md:text-5xl mb-8">
            運営パートナー
          </h2>
          <div className="flex flex-wrap justify-center">
            <div className="flex justify-center items-center m-8">
              <Image
                src="/assets/cfj.png"
                width={200}
                height={100}
                alt="Code for Japan"
              />
            </div>
            <div className="flex justify-center items-center m-8">
              <Image
                src="/assets/shibuya.png"
                width={200}
                height={100}
                alt="渋谷区"
              />
            </div>
            <div className="flex justify-center items-center m-8">
              <Image
                src="/assets/descitokyo_no_BG_black.png"
                width={150}
                height={75}
                alt="DeSci Tokyo"
              />
            </div>
          </div>
        </div>






        <section className="px-8 md:px-18 lg:px-36 py-16 bg-white">
          <div className="max-w-6xl mx-auto border border-black rounded-lg overflow-hidden">
            <div className="flex flex-col">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/2 p-8 border-b md:border-b-0 md:border-r border-black">
                  <h3 className="text-4xl font-bold mb-6">クラウドファンディングと助成金の融合</h3>
                  <p className="mb-6">Quadratic Funding でコミュニティの力を活用する</p>
                  <blockquote className="border-l-4 border-gray-300 pl-4 text-sm mb-6">
                    <p>
                      Gitcoin による二次資金の助成は、資金の割り当てだけでなく、優れたシグナル伝達ツールでもあります。ここ数ラウンド、Gitcoin に行くことで、これまで知らなかった本当にクールな Ethereum プロジェクトをたくさん発見することができました。
                    </p>
                    <footer className="text-sm italic mt-2">ヴィタリック・ブテリン、イーサリアム</footer>
                  </blockquote>
                </div>
                <div className="relative md:w-1/2 h-64 md:h-auto">
                  <Image
                    src="https://i.gyazo.com/874fd42a84cefa25ff18dd1849fb530f.jpg"
                    alt="Quadratic Funding イメージ"
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row border-t border-black">
                <div className="relative md:w-1/2 h-64 md:h-auto border-b md:border-b-0 md:border-r border-black">
                  <Image
                    src="https://i.gyazo.com/1153595844492a0c09705c2a96e04c31.png"
                    alt="サポーター活性化イメージ"
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
                <div className="md:w-1/2 p-8">
                  <h3 className="text-4xl font-bold mb-6">サポーターを活性化する</h3>
                  <p className="mb-6">つながりを育み、プロジェクトの評判を高めます</p>
                  <blockquote className="border-l-4 border-gray-300 pl-4 text-sm mb-6">
                    <p>
                      Gitcoin が私にもたらしてくれた最大のことは、検証を与えてくれたことです。
                    </p>
                    <footer className="text-sm italic mt-2">デビッド・ホフマン、バンクレス</footer>
                  </blockquote>
                </div>
              </div>
            </div>
          </div>
        </section>




        <section className="px-8 md:px-18 lg:px-36 py-16 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-bold text-3xl md:text-5xl mt-12 lg:mt-0 mb-16">
              100円の寄付が1万円を動かす理由
            </h2>
            <p className=" max-w-3xl">
              {`デジタル庁から派生したDigDAOは、DeSci Tokyoの支援を受け、"公益プロジェクトへの資金提供"の新しい仕組みを模索しています。「マッチングドネーション」という仕組みは、政府が用意した資金プールからどのプロジェクトに分配するかを市民による寄付に応じて決定するものです。`}
            </p>
          </div>
        </section>


        <section className="px-8 md:px-18 lg:px-36">
          <div className="flex flex-wrap w-full items-center justify-center gap-x-12 gap-y-8">
            <div className="flex flex-col h-full w-full max-w-[350px] px-9 py-12 bg-[linear-gradient(90deg,_#E4F3DD_17.22%,_#FFE0DB_96.29%)] rounded-2xl border border-[#D9A596]">
              <p className="font-bold text-3xl mb-10">寄付</p>
              <p>
                お気に入りのプロジェクトを見つけて、誰でも寄付することができます。
                <br></br>
                あなたが寄付したお金は、QFの計算式に基づいてマッチングプールから上乗せされ、プロジェクトに対してより多くの資金を提供することができます。
              </p>
            </div>
            <div className="flex flex-col h-full w-full px-9 py-12 bg-white rounded-2xl border border-black">
              <p className="font-bold text-3xl mb-6">資金プール</p>
              <p className="flex-grow">
                この実験は「ビジネスとしては成り立たないけど社会的には価値のあるプロジェクト（公共財）」を支援するための新しい方法を模索しています。
                <br></br>
                今回は予算として10万円の資金プールを作成しました。この資金は、あなたたちの寄付によってどのプロジェクトに・どれぐらい分配するか決定されます。
              </p>
            </div>
            <div className="flex flex-col h-full w-full px-9 py-12 bg-white rounded-2xl border border-black">
              <p className="font-bold text-3xl mb-6">公益プロジェクト</p>
              <p className="flex-grow">
                私たちは、社会的意義のあるn個のプロジェクトを公募の上、選定しました。これらのプロジェクトが寄付先の選択肢となり、マッチングプールからの資金分配を受け取ることができます。
              </p>
            </div>
          </div>
          <div className="flex w-full items-center justify-center mt-16 mb-28">
            <Button
              onClick={() => router.push("/grants")}
              className="bg-white rounded-none border-none hover:bg-gray-100"
            >
              前回のプロジェクト一覧を見る
              <ArrowTopRightIcon className="ml-2" />
            </Button>
          </div>
        </section>


        <section className="px-8 md:px-18 lg:px-36">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-bold text-3xl md:text-5xl mt-12 lg:mt-0 mb-16">
              マッチングドネーションの仕組み
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-14">
              <div className="flex flex-col md:flex-row h-full w-full px-8 py-14 md:items-center rounded-2xl bg-white border border-black gap-6">
                <div className="relative flex w-full h-full flex-grow items-stretch min-h-[150px] md:flex-1">
                  <Image
                    src="/assets/quadratic-funding.png"
                    alt="Quadratic funding"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col flex-1">
                  <p className="font-bold text-2xl">
                    Quadratic Fundingによる分配
                  </p>
                  <p>
                    マッチングドネーションの計算にQuadratic
                    Fundingメカニズムを用いることで、幅広いコミュニティから支持されているプロジェクトが多くの助成金を受け取ることができます。
                                   </p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row h-full w-full px-8 py-14 md:items-center rounded-2xl bg-white border border-black gap-6">
                <div className="relative flex w-full h-full min-h-[150px] md:flex-1">
                  <Image
                    src="/assets/matching-pool.png"
                    alt="matching-pool"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col flex-1">
                  <p className="font-bold text-2xl">民主的な資金分配</p>
                  <p>
                    政府や自治体が分配先を決める従来の助成金とは違い、Quadratic
                    Fundingでは資金プールの分配先・額はあなたたちの寄付によって決定されます。
                  </p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row h-full w-full px-8 py-14 md:items-center rounded-2xl bg-white border border-black gap-6">
                <div className="relative flex w-full h-full min-h-[150px] md:flex-1">
                  <Image
                    src="/assets/contributors.png"
                    alt="contributors"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col flex-1">
                  <p className="font-bold text-2xl">
                    多くの人に愛されるプロジェクトが報われる
                  </p>
                  <p>
                    「あるプロジェクトへ寄付した人の数」は、各個人の寄付額より分配金額に大きな影響を与えるように設計されています。
                  </p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row h-full w-full px-8 py-14 md:items-center rounded-2xl bg-white border border-black gap-6">
                <div className="relative flex w-full h-full min-h-[150px] md:flex-1">
                  <Image
                    src="/assets/raised.png"
                    alt="raised"
                    fill
                    className="object-contain scale-150"
                  />
                </div>
                <div className="flex flex-col flex-1">
                  <p className="font-bold text-2xl">
                    90億円以上の分配実績を持つメカニズム
                  </p>
                  <p>
                    QFは民主的な資金分配の方法として、すでに十分な実績を持っています。Ethereum上の公共財プロジェクトに$60M+の資金分配をしたり、UNICEFからNGOへ資金分配する方法として選ばれています。
                  </p>
                </div>
              </div>
            </div>
            <div className="flex w-full justify-end mt-14 mb-28">
              <Button
                style="ghost"
                onClick={() =>
                  window.open(
                    "https://mirror.xyz/0xFEd3A62567FCEDfD10f56467EA6Db8c39c313606/sI97HdGBKr0ROPouXT5iKMJZHlrDm2TB45Ti4VkmLo8",
                    "_blank"
                  )
                }
              >
                Quadratic Fundingについてより詳しく{" "}
                <ArrowTopRightIcon className="ml-2" />
              </Button>
            </div>
          </div>
        </section>

        <section className="px-8 md:px-18 lg:px-36 py-16 bg-white">
          <div className="max-w-6xl mx-auto border border-black rounded-lg overflow-hidden">
            <div className="flex flex-col">
              <div className="p-8 border-b border-black">
                <button className="text-sm font-semibold text-gray-500 mb-2 flex items-center" onClick={() => window.open("https://note.com/tkgshn/n/nfa5142139665", "_blank")}>
                  DigDAOマッチングドネーション第一回目の結果を見る
                  <ArrowTopRightIcon className="ml-2" />
                </button>
                <br></br>
                <h2 className="font-bold text-3xl md:text-5xl leading-tight mb-4">
                  日本初のQuadratic Fundingを使った資金分配
                </h2>
              </div>
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-8 border-b md:border-b-0 md:border-r border-black">
                  <p className="text-4xl font-bold">18</p>
                  <p className="text-sm text-gray-500 mb-4">支援されたプロジェクト</p>
                  <div className="relative" style={{ position: 'relative', paddingTop: '75%' }}>
                    <Image
                      src="https://i.gyazo.com/edf444f6dcc7345abff45d89391c2498.png"
                      alt="project distribution"
                      layout="fill"
                      objectFit="contain"
                    />
                  </div>
                </div>
                <div className="flex-1 p-8 border-b md:border-b-0 md:border-r border-black">
                  <p className="text-4xl font-bold">¥155,968</p>
                  <p className="text-sm text-gray-500 mb-4">ユニークな寄付</p>
                  <div className="relative" style={{ position: 'relative', paddingTop: '75%' }}>
                    <Image
                      src="https://i.gyazo.com/0c1dcdda30dfb05a0acf5df87b0855b9.png"
                      alt="donation breakdown"
                      layout="fill"
                      objectFit="contain"
                    />
                  </div>
                </div>
                <div className="flex-1 p-8">
                  <p className="text-4xl font-bold">¥267,536</p>
                  <p className="text-sm text-gray-500 mb-4">公共財への支援</p>
                  <div className="relative" style={{ position: 'relative', paddingTop: '75%' }}>
                    <Image
                      src="https://i.gyazo.com/7c432690b3c4e92fb4c621649cc5f515.png"
                      alt="allocation distribution"
                      layout="fill"
                      objectFit="contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-8 md:px-18 lg:px-36 py-16 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-bold text-3xl md:text-4xl mb-8">
              運営パートナー・参加プロジェクトの声
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="border rounded-lg p-6 flex flex-col mx-auto border border-black rounded-lg overflow-hidden">
                  <div className="flex items-center mb-4">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      width={60}
                      height={60}
                      className="rounded-full mr-4"
                    />
                    <div>
                      <h3 className="font-bold text-xl">{testimonial.name}</h3>
                      <p className="text-base text-gray-600">{testimonial.title}</p>
                    </div>
                  </div>
                  <p className="text-lg mb-4">{nl2br(testimonial.comment)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* <section className="flex flex-row w-full justify-center bg-sg-primary px-8 md:px-24 lg:px-48 xl:px-96 py-28 gap-x-4">
          <p className="font-bold text-[128px] text-[#99BCD1] leading-none -translate-y-6 absolute left-0 md:relative">
            “
          </p>
          <div className="flex flex-col">
            <p className="font-bold text-4xl mb-5 z-[2] max-w-4xl">
              マッチングドネーションは、より多くの人の価値観を反映するための新たな参加形寄付方式です。
              <br></br>
              これにより、自治体内での審査プロセスは短縮し、より民主的な方法で資金を分配できるようになりました。
            </p>
            <p>関 治之, Code for Japan</p>
          </div>
        </section> */}

        <section className="flex flex-col w-full items-center justify-center mt-24">
          <h3 className="font-bold text-3xl lg:text-5xl mb-14 text-center">
            前回掲載したプロジェクトの一例
          </h3>
          <div className="flex flex-col md:flex-row gap-12">
            {data &&
              data
                .sort(() => Math.random() - 0.5)
                .slice(0, 3)
                .map((grant) => (
                  <GrantCard
                    grant={grant}
                    key={grant.id}
                    hideButton
                    onClick={() => router.push(`/grants/${grant.id}`)}
                  />
                ))}
          </div>
        </section>
        <section className="flex flex-col w-full items-center justify-center text-center mt-40">
          <h3 className="font-bold text-3xl lg:text-5xl">
            あなたの寄付が公益プロジェクトを支える
          </h3>
          <p className="mt-3 mb-10 text-lg md:text-xl">
            100円からでもプロジェクトに資金を提供できます。
          </p>
          {/* <Button onClick={() => router.push("/get-started")}> */}
          <Button
            className="bg-black text-white py-2 px-6 hover:bg-gray-800 transition-colors duration-300 rounded-none"
            onClick={() => router.push("/grants")}
          >
            前回のプロジェクト一覧を見る
          </Button>
        </section>
        <div className="relative flex w-full my-16">
          <Image
            src="/assets/abstract-blue.svg"
            width={1920}
            height={384}
            alt="abstract"
            className="scale-200 md:scale-150 lg:scale-125 w-screen"
          />
        </div>
        <footer className="w-full flex flex-col md:flex-row px-6 py-8 md:px-28 md:py-16 gap-x-14 justify-between items-start">
          <div className="w-full flex-col">
            <Image
              src="/logo.png"
              alt="DigDAOマッチングドネーション"
              width={162}
              height={50}
              className="mb-8"
            />
            <div className="flex space-x-4">
              <Link
                href={"https://github.com/dig-dao/simplegrants"}
                target="_blank"
              >
                <Github className="w-8 fill-sg-secondary cursor-pointer" />
              </Link>
              <Link href={"https://twitter.com/digdaox"} target="_blank">
                <Twitter className="w-8 fill-sg-secondary cursor-pointer" />
              </Link>
            </div>
          </div>
          <div className="flex flex-row flex-wrap lg:flex-nowrap gap-x-8 w-full justify-between">
            <div className="flex flex-col gap-y-3 mb-6">
              <Link
                href="https://scrapbox.io/public-goods-funding/DigDAO_%E3%83%9E%E3%83%83%E3%83%81%E3%83%B3%E3%82%B0%E3%83%89%E3%83%8D%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3%E3%83%97%E3%83%AD%E3%82%B8%E3%82%A7%E3%82%AF%E3%83%88%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6"
                target="_blank"
              >
                <p className="font-bold text-xl cursor-pointer">
                  プロジェクトについて
                </p>
              </Link>
              <Link
                href="https://prtimes.jp/main/html/rd/p/000000067.000039198.html"
                target="_blank"
              >
                <p className="font-sm cursor-pointer">プレスリリース</p>
              </Link>
              <Link href="https://www.digdao.jp/" target="_blank">
                <p className="font-sm cursor-pointer">DigDAOとは</p>
              </Link>
            </div>
            <div className="flex flex-col gap-y-3 mb-6">
              <p className="font-bold text-xl">連絡先</p>
              <Link
                href="https://scrapbox.io/public-goods-funding/%E5%85%AC%E7%9B%8A%E3%83%97%E3%83%AD%E3%82%B8%E3%82%A7%E3%82%AF%E3%83%88%E3%81%A8%E3%81%97%E3%81%A6%E6%8E%B2%E8%BC%89%E3%81%97%E3%81%9F%E3%81%84%E4%BA%BA%E3%81%B8"
                target="_blank"
              >
                <p className="font-sm cursor-pointer">
                  プロジェクトを掲載したい
                </p>
              </Link>
              <Link
                href="https://scrapbox.io/public-goods-funding/%E3%83%9E%E3%83%83%E3%83%81%E3%83%B3%E3%82%B0%E3%83%89%E3%83%8D%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3%E3%82%92%E4%BC%81%E7%94%BB%E3%81%97%E3%81%A6%E3%80%81%E3%82%A8%E3%82%B3%E3%82%B7%E3%82%B9%E3%83%86%E3%83%A0%E3%82%92%E8%82%B2%E3%81%A6%E3%81%9F%E3%81%84%E4%BA%BA%E3%81%B8"
                target="_blank"
              >
                <p className="font-sm cursor-pointer">資金を提供したい</p>
              </Link>
            </div>
            <div className="flex flex-col gap-y-3 mb-6">
              <p className="font-bold text-xl">法に関すること</p>
              <Link
                href="https://github.com/dig-dao/simplegrants/blob/main/terms.md"
                target="_blank"
              >
                <p className="font-sm cursor-pointer">利用規約</p>
              </Link>
              <Link
                href="https://github.com/dig-dao/simplegrants/blob/main/policy.md"
                target="_blank"
              >
                <p className="font-sm cursor-pointer">プライバシーポリシー</p>
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
