export default function SportsIndexPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Big 12 Sports
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-3xl mx-auto">
            Explore all sports scheduled by FlexTime across the Big 12 Conference
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[
            { name: 'Baseball', id: 1, url: 'baseball', icon: '⚾' },
            { name: 'Men\'s Basketball', id: 2, url: 'mens-basketball', icon: '🏀' },
            { name: 'Women\'s Basketball', id: 3, url: 'womens-basketball', icon: '🏀' },
            { name: 'Football', id: 8, url: 'football', icon: '🏈' },
            { name: 'Gymnastics', id: 11, url: 'gymnastics', icon: '🤸' },
            { name: 'Lacrosse', id: 12, url: 'lacrosse', icon: '🥍' },
            { name: 'Soccer', id: 14, url: 'soccer', icon: '⚽' },
            { name: 'Softball', id: 15, url: 'softball', icon: '🥎' },
            { name: 'Men\'s Tennis', id: 18, url: 'mens-tennis', icon: '🎾' },
            { name: 'Women\'s Tennis', id: 19, url: 'womens-tennis', icon: '🎾' },
            { name: 'Volleyball', id: 24, url: 'volleyball', icon: '🏐' },
            { name: 'Wrestling', id: 25, url: 'wrestling', icon: '🤼' }
          ].map((sport) => (
            <a 
              key={sport.id} 
              href={`/sports/${sport.url}`}
              className="backdrop-blur-xl bg-white/5 border border-slate-800 hover:border-cyan-500/30 rounded-lg p-6 h-full transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">{sport.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                    {sport.name}
                  </h3>
                  <p className="text-sm text-slate-400">Sport ID: {sport.id}</p>
                </div>
              </div>
              <div className="mt-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all duration-300">
                →
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}