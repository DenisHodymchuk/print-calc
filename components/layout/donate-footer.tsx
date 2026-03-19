import { Heart } from 'lucide-react'

const MONO_URL = 'https://send.monobank.ua/jar/6oieqkWwQ'
const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(MONO_URL)}`

export function DonateFooter() {
  return (
    <footer className="border-t border-border bg-card mt-8">
      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center gap-6">
        {/* QR */}
        <img
          src={QR_URL}
          alt="QR код для донату"
          className="w-24 h-24 rounded-xl border border-border flex-shrink-0"
          width={96}
          height={96}
        />

        {/* Text */}
        <div className="flex-1 text-center sm:text-left">
          <p className="font-bold text-base flex items-center gap-2 justify-center sm:justify-start">
            <Heart className="w-4 h-4 text-red-500" />
            Підтримати проєкт
          </p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Якщо калькулятор був корисний — ви можете підтримати розвиток проєкту донатом. Усі кошти йдуть на хостинг, домен та покращення функціоналу.
          </p>
        </div>

        {/* Button */}
        <a
          href={MONO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#333] text-white font-medium text-sm px-5 py-2.5 rounded-lg transition-colors flex-shrink-0"
        >
          <Heart className="w-4 h-4" />
          Підтримати через Монобанк
        </a>
      </div>
    </footer>
  )
}
