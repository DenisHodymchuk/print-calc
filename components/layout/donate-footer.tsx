import { Heart } from 'lucide-react'

const MONO_URL = 'https://send.monobank.ua/jar/6oieqkWwQ'

export function DonateFooter() {
  return (
    <footer className="border-t border-border mt-8">
      <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          <Heart className="w-3.5 h-3.5 text-red-500 inline mr-1.5 -mt-0.5" />
          Якщо калькулятор корисний — підтримайте розвиток проєкту
        </p>
        <a
          href={MONO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#333] text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors flex-shrink-0"
        >
          <Heart className="w-3.5 h-3.5" />
          Підтримати
        </a>
      </div>
    </footer>
  )
}
