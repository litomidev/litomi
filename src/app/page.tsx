import Link from 'next/link'

export default function Home() {
  return (
    <main className="h-dvh flex flex-col items-center justify-center gap-5 mx-auto p-4 text-center">
      <svg className="w-14 shrink-0" viewBox="0 0 100 100">
        <circle cx="50" cy="50" fill="white" r="45" stroke="red" strokeWidth="10" />
        <text
          dominantBaseline="middle"
          fill="black"
          fontFamily="Arial"
          fontSize="40"
          fontWeight="bold"
          textAnchor="middle"
          x="50%"
          y="55"
        >
          19
        </text>
      </svg>
      <h1 className="text-lg font-bold max-w-prose">
        이 정보 내용은 청소년유해매체물로서 “정보통신망 이용촉진 및 정보보호 등에 관한 법률” 및 “청소년 보호법”에 따라
        19세 미만의 청소년이 이용할 수 없습니다.
      </h1>
      <h2 className="max-w-prose">
        본 웹사이트에는 19세 이상 전용의 성인 콘텐츠(성인 만화 등)가 포함되어 있습니다. 이용자는 “19세 이상 성인입니다”
        버튼을 클릭함으로써, 본인이 19세 이상이거나 현지법상 성인임을 확인하고 해당 콘텐츠 이용에 동의하는 것으로
        간주됩니다.
      </h2>
      <div className="grid gap-2 [&_a]:border-2 [&_a]:rounded-lg [&_a]:w-60 [&_a]:py-2 [&_a]:font-semibold ">
        <Link
          className="bg-brand-gradient relative text-background before:absolute before:inset-0 before:rounded-lg before:border-2 before:border-foreground/40"
          href="/mangas/1/hi/card"
        >
          19세 이상 성인입니다
        </Link>
        <Link className="rounded" href="/deterrence">
          19세 미만 나가기
        </Link>
      </div>
    </main>
  )
}
