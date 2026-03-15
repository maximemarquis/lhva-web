export type GoalType = 'ev' | 'pp' | 'sh' | 'en' | 'so' | 'pen-shot'
export type GameType = 'regular' | 'playoff-qf' | 'playoff-sf' | 'playoff-final'
export type ArticleStatus = 'draft' | 'published' | 'scheduled' | 'archived'
export type ArticleCategory = 'playoffs' | 'players' | 'awards' | 'league' | 'recap' | 'general'
export type PlayerPosition = 'F' | 'D' | 'G'
export type AdminRole = 'commissioner' | 'team_rep' | 'scorekeeper' | 'readonly'

export interface Season {
  id: number
  label: string
  start_date: string
  end_date: string | null
  is_active: boolean
}

export interface Team {
  id: number
  name_en: string
  name_fr: string
  abbreviation: string
  slug: string
  color: string
  arena: string | null
  city: string | null
}

export interface Player {
  id: number
  team_id: number
  first_name: string
  last_name: string
  jersey_number: number | null
  position: PlayerPosition
  is_active: boolean
  team?: Team
}

export interface Goal {
  id: number
  game_id: number
  team_id: number
  scorer_id: number
  assist1_id: number | null
  assist2_id: number | null
  period: number
  time_in_period: string
  goal_type: GoalType
  scorer?: Player
  assist1?: Player
  assist2?: Player
  team?: Team
}

export interface Penalty {
  id: number
  game_id: number
  team_id: number
  player_id: number
  period: number
  time_in_period: string
  infraction: string
  minutes: number
  player?: Player
  team?: Team
}

export interface Game {
  id: number
  season_id: number
  home_team_id: number
  away_team_id: number
  played_at: string
  home_score: number | null
  away_score: number | null
  game_type: GameType
  overtime: boolean
  shootout: boolean
  is_published: boolean
  scorekeeper: string | null
  notes: string | null
  home_team?: Team
  away_team?: Team
  goals?: Goal[]
  penalties?: Penalty[]
}

export interface StandingRow {
  season_id: number
  team_id: number
  gp: number
  w: number
  l: number
  otl: number
  gf: number
  ga: number
  pts: number
  diff: number
  name_en: string
  name_fr: string
  abbreviation: string
  color: string
  slug: string
}

export interface Article {
  id: number
  title_en: string
  title_fr: string | null
  slug: string
  body_en: string | null
  body_fr: string | null
  category: ArticleCategory
  team_id: number | null
  status: ArticleStatus
  published_at: string | null
  author: string | null
  created_at: string
  updated_at: string
  team?: Team
}

export interface PlayerStat {
  player_id: number
  player: Player
  games_played: number
  goals: number
  assists: number
  points: number
  pim: number
}