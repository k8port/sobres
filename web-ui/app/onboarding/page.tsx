
export default function Page() {
    return (
        <main className="flex min-h-screen flex-col p-6">
            <div className="flex h-20 shrink-0 items-end rounded-lg bg-blue-100 p-4 md:h-52">
                {/* <AcmeLogo /> */}
            </div>
            <div className="mt-4 flex grow flex-col gap-4 md:flex-row">
                <div className="flex flex-col justify-center gap-6 rounded-lg bg-gray-50 px-6 py-10 md:w-2/5 md:px-20">
                    <p className={`text-xl text-gray-800 md:text-3xl md:leading-normal`}>
                        <strong><span className="font-slackey">Sobre Vida</span></strong><br/>
                        <span className="text-base">a finance management tool for outlaws, outcasts and other miscreants.</span>
                    </p>
                </div>
                <div className="flex items-center justify-center p-6 md:w-3/5 md:px-28 md:py-12">
                    <img src="/images/hero.png" alt="Sobre Vida" />
                </div>
            </div>
        </main>
    );
}
