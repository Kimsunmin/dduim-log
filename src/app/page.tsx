const routes = [
  {
    title: "망원 한강 노을 루프",
    place: "망원한강공원",
    distance: "5.2km",
    time: "29분",
    tags: ["신호등 적음", "한강뷰", "평지"],
  },
  {
    title: "연남 골목 워밍업",
    place: "경의선숲길",
    distance: "3.4km",
    time: "19분",
    tags: ["가로등", "카페거리", "초보 추천"],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f7f1e8] text-[#251f1a]">
      <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-[#fffaf2] shadow-2xl shadow-[#564333]/20">
        <section className="relative flex min-h-screen flex-1 flex-col">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,#d8f3ee_0%,#f9e7aa_52%,#f4c7bf_100%)]" />
          <div className="absolute inset-0 opacity-55 [background-image:linear-gradient(#ffffff80_1px,transparent_1px),linear-gradient(90deg,#ffffff80_1px,transparent_1px)] [background-size:42px_42px]" />
          <div className="absolute left-12 top-28 h-2 w-48 rotate-[-18deg] rounded-full bg-[#18b7a8]" />
          <div className="absolute left-24 top-40 h-2 w-44 rotate-[24deg] rounded-full bg-[#ff6b6b]" />
          <div className="absolute left-36 top-52 h-2 w-36 rotate-[-10deg] rounded-full bg-[#3d6df2]" />

          <header className="relative z-10 flex items-center justify-between px-6 pt-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#776a5d]">
                dduim.log
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-normal">
                어디로 뛸까?
              </h1>
            </div>
            <button
              className="grid size-11 place-items-center rounded-full bg-white/85 text-xl shadow-lg shadow-[#665038]/15"
              aria-label="내 저장 목록"
            >
              <span aria-hidden="true">♡</span>
            </button>
          </header>

          <div className="relative z-10 mt-6 flex gap-2 overflow-x-auto px-6 pb-2">
            {["탐색", "보관함", "그리기"].map((item, index) => (
              <button
                key={item}
                className={`h-10 shrink-0 rounded-full px-5 text-sm font-bold shadow-sm ${
                  index === 0
                    ? "bg-[#251f1a] text-white"
                    : "bg-white/80 text-[#53483e]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="relative z-10 mt-auto rounded-t-[2rem] bg-[#fffaf2]/95 px-5 pb-6 pt-4 shadow-[0_-18px_60px_rgba(67,54,38,0.18)] backdrop-blur">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#d7c9b7]" />
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-sm font-bold text-[#18a999]">지금 보이는 코스</p>
                <h2 className="text-2xl font-black">망원 근처 뜀로그</h2>
              </div>
              <span className="rounded-full bg-[#e6f8f5] px-3 py-1 text-xs font-bold text-[#147f76]">
                {routes.length}개
              </span>
            </div>

            <div className="flex snap-x gap-4 overflow-x-auto pb-2">
              {routes.map((route) => (
                <article
                  key={route.title}
                  className="w-[82%] shrink-0 snap-center rounded-[1.75rem] bg-white p-4 shadow-lg shadow-[#665038]/10"
                >
                  <div className="mb-4 h-28 rounded-[1.25rem] bg-[linear-gradient(135deg,#bfeee7,#ffe39a_55%,#ffb3a8)] p-3">
                    <div className="h-full rounded-[1rem] border-2 border-dashed border-white/80" />
                  </div>
                  <p className="text-xs font-bold text-[#7b6f62]">{route.place}</p>
                  <h3 className="mt-1 text-xl font-black">{route.title}</h3>
                  <div className="mt-3 flex gap-2 text-sm font-bold text-[#3d332b]">
                    <span>{route.distance}</span>
                    <span aria-hidden="true">·</span>
                    <span>{route.time}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {route.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#f4efe7] px-3 py-1 text-xs font-bold text-[#64584d]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
