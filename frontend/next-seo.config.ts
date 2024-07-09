import { DefaultSeoProps } from "next-seo";

const config: DefaultSeoProps = {
  defaultTitle: "DigDAO マッチングドネーション",
  additionalMetaTags: [
    {
      property: "keywords",
      content:
        "DigDAO, quadratic, funding, quadratic funding, fundraising, raise, grants",
    },
  ],
  canonical: "https://donation.digdao.jp/",
  openGraph: {
    type: "website",
    title: "DigDAO マッチングドネーション",
    description: "マッチングドネーション（Quadratic Funding）でお気に入りのプロジェクトに寄付して、公共財を支援しよう",
    url: "https://donation.digdao.jp/",
    images: [
      {
        url: "https://i.gyazo.com/0a84e70567833243895c2eb25277a7b6.png",
        // 画像は仮
        width: 1200,
        height: 630,
        alt: "DigDAO マッチングドネーション - サムネイル画像",
      }
    ],
  },
  twitter: {
    handle: "@digdaox",
    site: "@digdaox",
    cardType: "summary_large_image",
  },
};

export default config;
