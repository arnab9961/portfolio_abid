export type Language = 'en' | 'bn' | 'ja'
export type Category = string

export type ActivityType = 'Awards & Recognition' | 'Exhibitions' | 'Events & Workshops' | 'Professional Activities' | 'Places Visited' | 'Other Activities'

export type Activity = {
  id: number | string
  title: string
  titleBn?: string
  titleJa?: string
  type: ActivityType
  date: string
  location: string
  description: string
  descriptionBn?: string
  descriptionJa?: string
  image: string
  additionalImages?: string[]
  externalUrl?: string
  status: 'draft' | 'published'
}

export type Artwork = {
  id: number | string
  title: string
  titleBn?: string
  titleJa?: string
  category: Category
  year?: string
  description: string
  descriptionBn?: string
  descriptionJa?: string
  image: string
  featured?: boolean
  status: 'draft' | 'published'
}

export type ArtistProfile = {
  name: string
  discipline: string
  portrait: string
  heroImage: string
  bio: Record<Language, string>
  email: string
  phone: string
  whatsapp: string
  facebook: string
}

export const artist: ArtistProfile = {
  name: 'Abid Hossain',
  discipline: '3D Landscape Artist',
  portrait: '/artist-portrait.jpg',
  heroImage: '',
  bio: {
    en: 'Biography placeholder — add the artist’s story, practice, and background here.',
    bn: 'জীবনী প্লেসহোল্ডার — শিল্পীর গল্প, শিল্পচর্চা এবং পরিচয় এখানে যোগ করুন।',
    ja: '略歴プレースホルダー — アーティストの物語、制作活動、背景をここに追加してください。',
  },
  email: '',
  phone: '',
  whatsapp: '',
  facebook: '',
}

export const artworks: Artwork[] = []

export const activities: Activity[] = []

export const ui = {
  en: { selectedWorks: 'Selected works', about: 'About', contact: 'Contact', connect: "Let's connect", hero: 'Imagining landscapes beyond reality.', intro: 'Creating immersive 3D landscapes that blend imagination, atmosphere, and the beauty of the natural world.', explore: 'Explore the work', getInTouch: 'Get in touch', scroll: 'Scroll to explore', location: 'Dhaka · Bangladesh', worlds: 'Imagined worlds.', galleryIntro: 'A growing collection of imagined worlds, natural forms, and atmospheric landscapes.', all: 'All', empty: 'New landscapes are coming soon.', aboutArtist: 'About the artist', approach: 'Creative approach', focus: 'Focus', focusValue: 'Atmospheric environments', based: 'Based in', basedValue: 'Dhaka, Bangladesh', contactIntro: "Have a project, collaboration, or creative idea? I'd love to hear from you.", email: 'Email me', call: 'Call me', whatsapp: 'WhatsApp', admin: 'Studio admin', featured: 'Featured work' },
  bn: { selectedWorks: 'নির্বাচিত কাজ', about: 'শিল্পী পরিচিতি', contact: 'যোগাযোগ', connect: 'যোগাযোগ করুন', hero: 'বাস্তবতার ওপারে কল্পিত ভূদৃশ্য।', intro: 'কল্পনা, আবহ এবং প্রকৃতির সৌন্দর্য মিলিয়ে তৈরি করি নিমগ্ন 3D ভূদৃশ্য।', explore: 'কাজ দেখুন', getInTouch: 'যোগাযোগ করুন', scroll: 'আরও দেখতে স্ক্রল করুন', location: 'ঢাকা · বাংলাদেশ', worlds: 'কল্পিত জগত।', galleryIntro: 'কল্পিত জগত, প্রাকৃতিক রূপ এবং আবহময় ভূদৃশ্যের একটি ক্রমবর্ধমান সংগ্রহ।', all: 'সব', empty: 'নতুন ভূদৃশ্য শীঘ্রই আসছে।', aboutArtist: 'শিল্পী সম্পর্কে', approach: 'সৃজনশীল পদ্ধতি', focus: 'কেন্দ্রবিন্দু', focusValue: 'আবহময় পরিবেশ', based: 'অবস্থান', basedValue: 'ঢাকা, বাংলাদেশ', contactIntro: 'কোনো প্রকল্প, সহযোগিতা বা সৃজনশীল ধারণা আছে? আপনার কথা শুনতে চাই।', email: 'ইমেইল করুন', call: 'ফোন করুন', whatsapp: 'হোয়াটসঅ্যাপ', admin: 'স্টুডিও অ্যাডমিন', featured: 'নির্বাচিত কাজ' },
  ja: { selectedWorks: 'セレクト作品', about: 'アーティスト', contact: 'お問い合わせ', connect: 'お問い合わせ', hero: '現実を超える風景を想像する。', intro: '想像力と空気感、自然の美しさを融合した没入感のある3D風景を制作しています。', explore: '作品を見る', getInTouch: 'お問い合わせ', scroll: 'スクロールして見る', location: 'ダッカ · バングラデシュ', worlds: '想像の世界。', galleryIntro: '想像の世界、自然のかたち、空気感のある風景のコレクション。', all: 'すべて', empty: '新しい風景を近日公開します。', aboutArtist: 'アーティストについて', approach: 'クリエイティブ・アプローチ', focus: '焦点', focusValue: '空気感のある環境', based: '拠点', basedValue: 'ダッカ、バングラデシュ', contactIntro: 'プロジェクトやコラボレーションのご相談をお待ちしています。', email: 'メールする', call: '電話する', whatsapp: 'WhatsApp', admin: 'スタジオ管理', featured: '注目作品' },
} as const

export type Ui = { [K in keyof typeof ui.en]: string }
