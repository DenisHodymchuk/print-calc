interface HeaderProps {
  title: string
  subtitle?: string
  accent?: string
}

export function Header({ title, subtitle, accent }: HeaderProps) {
  return (
    <div className="max-w-7xl mx-auto px-6 pt-10 pb-2">
      <h1 className="text-4xl font-black tracking-tight leading-tight">
        {title}
        {accent && (
          <>
            {' '}
            <span className="text-primary">{accent}</span>
          </>
        )}
      </h1>
      {subtitle && (
        <p className="text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  )
}
