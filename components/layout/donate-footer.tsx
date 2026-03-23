import { Heart } from 'lucide-react'

const MONO_URL = 'https://send.monobank.ua/jar/6oieqkWwQ'
const TELEGRAM_URL = 'https://t.me/buba_lab_3d'
const TIKTOK_URL = 'https://www.tiktok.com/@buba_lab_print?_r=1&_t=ZS-94wKhS1gZhV'

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  )
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  )
}

export function DonateFooter() {
  return (
    <footer className="border-t border-border mt-8">
      <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          <Heart className="w-3.5 h-3.5 text-red-500 inline mr-1.5 -mt-0.5" />
          Якщо калькулятор корисний — підтримайте розвиток проєкту
        </p>

        <div className="flex items-center gap-3 flex-shrink-0">
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-lg bg-[#26A5E4] hover:bg-[#1e96d1] flex items-center justify-center transition-colors"
            title="Telegram"
          >
            <TelegramIcon className="w-4.5 h-4.5 text-white" />
          </a>
          <a
            href={TIKTOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-lg bg-[#1a1a1a] hover:bg-[#333] flex items-center justify-center transition-colors"
            title="TikTok"
          >
            <TikTokIcon className="w-4.5 h-4.5 text-white" />
          </a>
          <a
            href={MONO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#333] text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Heart className="w-3.5 h-3.5" />
            Підтримати
          </a>
        </div>
      </div>
    </footer>
  )
}
