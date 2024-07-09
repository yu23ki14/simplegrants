import Head from "next/head";
import React from "react";
import MainLayout from "../layouts/MainLayout";
import Button from "../components/Button";
import { useRouter } from "next/router";

export default function GetStarted() {
  const router = useRouter();

  return (
    <div>
      <Head>
        <title>ようこそ | DigDAOマッチングドネーション</title>
        <meta
          name="description"
          content="マッチングドネーション（Quadratic Funding）でお気に入りのプロジェクトに寄付して、公共財を支援しよう"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <MainLayout className="items-center justify-center">
        <div className="flex flex-col items-center justify-between h-full text-center">
          <h1 className="font-bold text-4xl mb-5">さあ、始めましょう！</h1>
          <p className="mb-14">どこから始めますか？</p>
          <div className="flex flex-row flex-wrap items-center justify-center gap-x-9 gap-y-4">
            <Button
              style="outline"
              className="min-w-[180px] text-base"
              onClick={() => router.push("/grants/create")}
            >
              プロジェクトを追加
            </Button>
            <Button
              style="outline"
              className="min-w-[180px] text-base"
              onClick={() => router.push("/grants/")}
            >
              プロジェクトへ寄付
            </Button>
            <Button
              style="outline"
              className="min-w-[180px] text-base"
              onClick={() => router.push("/pools/")}
            >
              資金プールを支援
            </Button>
          </div>
        </div>
      </MainLayout>
    </div>
  );
}
