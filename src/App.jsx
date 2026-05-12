import { useEffect, useMemo, useRef, useState } from 'react'
import { Home, Video, Music, MessageCircle } from 'lucide-react'

const audioTracks = {
  rain: {
    label: 'Rain',
    src: '/rain.mp3',
  },
  piano: {
    label: 'Piano',
    src: '/piano.mp3',
  },
}

const featureButtons = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
]

function DraggableWindow({ index, title, onClose, children }) {
  const [position, setPosition] = useState({ x: 120 + index * 20, y: 120 + index * 20 })
  const startRef = useRef(null)
  const cleanupRef = useRef({ move: null, up: null })

  useEffect(() => {
    return () => {
      if (cleanupRef.current.move) window.removeEventListener('pointermove', cleanupRef.current.move)
      if (cleanupRef.current.up) window.removeEventListener('pointerup', cleanupRef.current.up)
    }
  }, [])

  const handlePointerMove = (event) => {
    if (!startRef.current) return
    setPosition({
      x: startRef.current.offsetX + event.clientX - startRef.current.startX,
      y: startRef.current.offsetY + event.clientY - startRef.current.startY,
    })
  }

  const handlePointerUp = () => {
    if (cleanupRef.current.move) window.removeEventListener('pointermove', cleanupRef.current.move)
    if (cleanupRef.current.up) window.removeEventListener('pointerup', cleanupRef.current.up)
    cleanupRef.current.move = null
    cleanupRef.current.up = null
    startRef.current = null
  }

  const handlePointerDown = (event) => {
    if (event.button !== 0) return
    startRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      offsetX: position.x,
      offsetY: position.y,
    }

    cleanupRef.current.move = handlePointerMove
    cleanupRef.current.up = handlePointerUp
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  return (
    <section
      className="absolute z-30 min-w-[320px] max-w-sm cursor-default border border-white/40 bg-white/10 p-0 shadow-2xl backdrop-blur-2xl transition hover:scale-[1.003]"
      style={{ 
        left: position.x, 
        top: position.y, 
        borderRadius: '24px', /* ÉP CỨNG BO GÓC TRÒN */
        overflow: 'hidden'    /* ÉP CỨNG CẮT PHẦN THỪA */
      }}
    >
      <div
        className="window-handle flex items-center justify-between border-b border-white/20 bg-white/20 px-4 py-3 text-sm text-slate-900 backdrop-blur-md"
        onPointerDown={handlePointerDown}
        style={{ touchAction: 'none' }}
      >
        <span className="font-semibold uppercase tracking-[0.18em]">{title}</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white/40 px-2 py-1 text-xs font-bold text-slate-900 transition hover:bg-white/60"
        >
          ✕
        </button>
      </div>
      <div className="bg-transparent pb-4">{children}</div>
    </section>
  )
}

function App() {
  const [activeWindow, setActiveWindow] = useState('home')
  const [messages, setMessages] = useState([
    { sender: 'AI', text: 'Chào bạn, mình là bạn đồng hành chill của bạn. Muốn nghe nhạc hay trò chuyện hôm nay?' },
  ])
  const [draft, setDraft] = useState('')
  const [currentTrack, setCurrentTrack] = useState('rain')
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.55)
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/embed/jfKfPfyJRdk')
  const [quickReplies, setQuickReplies] = useState(['Tôi buồn', 'Kể chuyện vui', 'Gợi ý nhạc chill', 'Chia sẻ suy nghĩ'])
  const audioRef = useRef(null)

  const isAlone = true
  const roomOccupancy = isAlone ? 1 : 2

  useEffect(() => {
    const audio = new Audio(audioTracks[currentTrack].src)
    audio.loop = true
    audio.volume = volume
    audioRef.current = audio

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [currentTrack])

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = volume
  }, [volume])

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.src = audioTracks[currentTrack].src
    audioRef.current.load()
    audioRef.current.currentTime = 0
    if (isPlaying) {
      audioRef.current
        .play()
        .catch((error) => {
          console.error('Audio play error:', error)
          setIsPlaying(false)
        })
    }
  }, [currentTrack, isPlaying])

  const toggleWindow = (id) => {
    setActiveWindow((prev) => {
      const nextWindow = prev === id ? null : id
      if (id === 'chat' && prev !== 'chat') {
        setMessages((current) => [
          ...current,
          { sender: 'AI', text: 'Mình luôn sẵn sàng tâm sự cùng bạn nhé.' },
        ])
      }
      return nextWindow
    })
  }

  const handlePlayToggle = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }

    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false))
  }

  const sendMessage = () => {
    const text = draft.trim()
    if (!text) return
    setMessages((prev) => [...prev, { sender: 'You', text }])
    setDraft('')
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'AI',
          text: getChatbotReply(text),
        },
      ])
    }, 550)
  }

  const handleQuickReply = (reply) => {
    setMessages((prev) => [...prev, { sender: 'You', text: reply }])
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'AI',
          text: getChatbotReply(reply),
        },
      ])
    }, 550)
  }

  const getChatbotReply = (value) => {
    const normalized = value.toLowerCase()
    if (normalized.includes('nhạc') || normalized.includes('music') || normalized.includes('piano') || normalized.includes('chill')) {
      const replies = [
        'Mình gợi ý bản piano nhẹ nhàng và tiếng mưa rơi để cùng thư giãn nhé.',
        'Bạn thích nghe nhạc gì? Mình có thể bật piano hoặc mưa cho bạn.',
        'Âm nhạc là cách tuyệt vời để thư giãn. Hãy chọn bản nhạc yêu thích!',
      ]
      return replies[Math.floor(Math.random() * replies.length)]
    }
    if (normalized.includes('buồn') || normalized.includes('mệt') || normalized.includes('stress')) {
      const replies = [
        'Mình luôn ở đây để lắng nghe bạn. Hãy kể cho mình nghe chút thôi.',
        'Buồn hay mệt mỏi là điều bình thường. Bạn muốn tâm sự không?',
        'Hãy nghĩ về những điều tích cực. Mình luôn bên cạnh bạn.',
      ]
      return replies[Math.floor(Math.random() * replies.length)]
    }
    if (normalized.includes('chuyện vui') || normalized.includes('vui')) {
      const replies = [
        'Một câu chuyện vui: Tại sao gà qua đường? Để đến bên kia!',
        'Bạn biết không, cười nhiều giúp giảm stress. Kể mình nghe câu chuyện vui của bạn đi!',
        'Hãy nghĩ về kỷ niệm vui. Bạn có câu chuyện gì muốn chia sẻ?',
      ]
      return replies[Math.floor(Math.random() * replies.length)]
    }
    if (normalized.includes('suy nghĩ') || normalized.includes('chia sẻ')) {
      const replies = [
        'Mình rất vui khi bạn muốn chia sẻ. Hãy kể đi, mình lắng nghe.',
        'Suy nghĩ của bạn quan trọng. Mình ở đây để hỗ trợ bạn.',
        'Chia sẻ là cách tốt để giải tỏa. Bạn nghĩ gì vậy?',
      ]
      return replies[Math.floor(Math.random() * replies.length)]
    }
    const generalReplies = [
      'Tối nay yên tĩnh lắm, mình rất vui khi có bạn cùng trò chuyện.',
      'Bạn đang làm gì vậy? Mình muốn biết thêm về bạn.',
      'Thời tiết hôm nay đẹp quá, phù hợp để thư giãn.',
      'Hãy kể mình nghe về ngày hôm nay của bạn nhé.',
    ]
    return generalReplies[Math.floor(Math.random() * generalReplies.length)]
  }

  const activeButton = (id) => activeWindow === id

  const buttons = useMemo(
    () =>
      featureButtons.map((button) => {
        const Icon = button.icon
        return (
          <button
            key={button.id}
            type="button"
            onClick={() => toggleWindow(button.id)}
            /* PHÓNG TO NÚT LÊN 80x80px */
            className={`group relative flex h-[80px] w-[80px] items-center justify-center rounded-full border border-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-300 ${
              activeButton(button.id)
                ? 'bg-gradient-to-br from-violet-500/30 via-sky-400/25 to-cyan-400/20 text-white shadow-2xl shadow-violet-500/30'
                : 'bg-white/14 text-white shadow-2xl shadow-slate-950/40 hover:scale-110 hover:brightness-125'
            }`}
            aria-label={button.label}
            title={button.label}
          >
            {/* PHÓNG TO ICON LÊN 40px */}
            <Icon size={40} className="text-white" />
            <span className="pointer-events-none absolute -bottom-8 z-10 hidden text-[11px] text-slate-200 sm:block">
              {button.label}
            </span>
          </button>
        )
      }),
    [activeWindow],
  )

  const renderWindowContent = (id) => {
    switch (id) {
      case 'home':
        return (
          <div className="space-y-4 p-4 text-slate-900">
            <h2 className="text-xl font-semibold text-slate-900">Welcome to Vibe Room</h2>
            <p className="text-sm leading-6 text-slate-600/90">
              Không gian chill với nền phong cảnh, cửa sổ nổi, âm thanh tự nhiên và chatbot pastel.
            </p>
            <div className="rounded-3xl bg-slate-100 p-3 text-left text-sm text-slate-700 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.8)]">
              <p>Click vào biểu tượng Video, Music hoặc Chat để mở cửa sổ nổi.</p>
            </div>
          </div>
        )
      case 'video':
        return (
          <div className="space-y-3 p-4 text-slate-900">
            <h2 className="text-xl font-semibold text-slate-900">YouTube Player</h2>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Dán link YouTube embed..."
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-200/30"
            />
            <div className="overflow-hidden rounded-3xl border border-white/20 bg-white shadow-black/40">
              <iframe
                className="h-52 w-full"
                src={videoUrl}
                title="YouTube Video"
                allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )
      case 'music':
        return (
          <div className="space-y-4 p-4 text-slate-900">
            <h2 className="text-xl font-semibold text-slate-900">Soundscape</h2>
            <p className="text-sm leading-6 text-slate-600/90">
              Chọn bản nhạc nền và bật/tắt tiếng mưa hoặc piano.
            </p>
            <div className="grid gap-3">
              {Object.entries(audioTracks).map(([key, track]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCurrentTrack(key)}
                  className={`rounded-2xl px-4 py-3 text-left text-sm transition ${
                    currentTrack === key
                      ? 'bg-violet-500/25 text-white ring-1 ring-violet-200/30'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  <span className="block font-medium">{track.label}</span>
                  <span className="block text-slate-500 text-xs">{track.src}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handlePlayToggle}
              className="mt-2 inline-flex items-center justify-center rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-900 transition hover:bg-slate-200"
            >
              {isPlaying ? 'Pause audio' : 'Play audio'}
            </button>
          </div>
        )
      case 'chat':
        return (
          <div className="flex min-h-[320px] flex-col justify-between rounded-2xl bg-slate-900/80 p-4 text-white shadow-2xl shadow-slate-950/40 backdrop-blur-3xl m-2">
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-white">Chatbot AI</h2>
                <p className="text-sm text-slate-300/90">
                  Giao diện chat tối giản với hiệu ứng pastel mờ ảo.
                </p>
              </div>
              <div className="space-y-3 overflow-y-auto rounded-[28px] bg-slate-950/70 p-4 text-sm shadow-inner shadow-slate-950/30 max-h-48">
                {messages.map((item, index) => (
                  <div
                    key={`${item.sender}-${index}`}
                    className={`rounded-3xl px-4 py-3 ${
                      item.sender === 'You'
                        ? 'ml-auto max-w-[85%] bg-slate-800/90 text-white'
                        : 'max-w-[90%] bg-white/14 text-white'
                    }`}
                  >
                    <span className="block text-[11px] uppercase tracking-[0.18em] text-slate-400">
                      {item.sender}
                    </span>
                    <p className="mt-1 leading-6">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-3xl bg-slate-950/20 p-3">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && sendMessage()}
                placeholder="Gửi tin nhắn..."
                className="h-11 w-full rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 text-sm text-white outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-200/30"
              />
              <button
                type="button"
                onClick={sendMessage}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-violet-500 px-4 text-sm font-semibold text-white transition hover:bg-violet-400"
              >
                Gửi
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => handleQuickReply(reply)}
                  className="rounded-2xl bg-slate-950/40 px-3 py-1 text-xs text-white transition hover:bg-slate-950/60"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )
      case 'settings':
        return (
          <div className="space-y-4 p-4 text-slate-900">
            <h2 className="text-xl font-semibold text-slate-900">Settings</h2>
            <p className="text-sm leading-6 text-slate-600/90">
              Điều chỉnh âm lượng, bật/tắt nhạc nền.
            </p>
            <div className="space-y-3 rounded-3xl bg-slate-100 p-4 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <span>Volume</span>
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(event) => setVolume(Number(event.target.value))}
                className="w-full accent-violet-400"
              />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <video
        className="fixed inset-0 -z-10 h-full w-full object-cover"
        src="/bg.mp4"
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" />

      {/* MỞ RỘNG SIDEBAR (w-[110px]) VÀ DÙNG justify-evenly ĐỂ CHIA ĐỀU TỰ ĐỘNG */}
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-[110px] flex-col items-center justify-evenly bg-white/5 py-4 backdrop-blur-2xl shadow-2xl shadow-slate-950/40">
        
        {/* 4 NÚT TÍNH NĂNG Ở TRÊN */}
        {buttons}
        
        {/* NÚT PLAY/PAUSE Ở DƯỚI CŨNG ĐƯỢC PHÓNG TO (80x80px) VÀ ĐƯA VÀO CHUỖI CHIA ĐỀU */}
        <button
          type="button"
          onClick={handlePlayToggle}
          className="flex h-[80px] w-[80px] items-center justify-center rounded-full border border-white bg-white/14 text-3xl text-white shadow-2xl shadow-slate-950/40 transition duration-300 hover:scale-110 hover:brightness-125"
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>
      </aside>

      {/* ĐẨY NỘI DUNG CHÍNH RA XA HƠN ĐỂ KHÔNG BỊ SIDEBAR BỰ CHE MẤT (pl-[140px]) */}
      <main className="relative min-h-screen pl-[140px] pr-6 pt-6">
        {roomOccupancy === 1 && isAlone && activeWindow !== 'chat' && (
          <button
            type="button"
            onClick={() => toggleWindow('chat')}
            className="fixed top-20 right-10 z-40 max-w-sm rounded-3xl border border-white/30 bg-white/10 px-5 py-4 text-left text-sm text-white shadow-2xl shadow-slate-950/40 backdrop-blur-2xl transition hover:bg-white/20"
          >
            <p className="font-medium text-white">Tối nay thật yên tĩnh...</p>
            <p className="mt-1 text-xs text-slate-200">
              Bạn có muốn tâm sự cùng mình không?
            </p>
          </button>
        )}

        <div className="pointer-events-none fixed inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-slate-950/90 to-transparent" />

        {activeWindow && (
          <DraggableWindow
            index={0}
            title={activeWindow === 'chat' ? 'AI Chat' : activeWindow}
            onClose={() => toggleWindow(activeWindow)}
          >
            {renderWindowContent(activeWindow)}
          </DraggableWindow>
        )}
      </main>
    </div>
  )
}

export default App