export interface StravaAthlete {
  id: number;
  username?: string;
  firstname: string;
  lastname: string;
  city?: string;
  state?: string;
  country?: string;
  sex?: string;
  premium?: boolean;
  created_at?: string;
  updated_at?: string;
  profile_medium?: string;
  profile?: string;
  measurement_preference?: "feet" | "meters";
}

export interface StravaRideTotals {
  count: number;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  elevation_gain: number;
  achievement_count?: number;
}

export interface StravaAthleteStats {
  biggest_ride_distance?: number;
  biggest_climb_elevation_gain?: number;
  recent_ride_totals?: StravaRideTotals;
  ytd_ride_totals?: StravaRideTotals;
  all_ride_totals?: StravaRideTotals;
}

export interface StravaSegmentXoms {
  kom?: string;
  qom?: string;
  overall?: string;
}

export interface StravaSegment {
  id: number;
  name: string;
  activity_type: string;
  distance: number;
  average_grade: number;
  maximum_grade: number;
  elevation_high?: number;
  elevation_low?: number;
  total_elevation_gain: number;
  effort_count?: number;
  athlete_count?: number;
  star_count?: number;
  created_at?: string;
  updated_at?: string;
  city?: string;
  state?: string;
  country?: string;
  private?: boolean;
  hazardous?: boolean;
  starred?: boolean;
  xoms?: StravaSegmentXoms;
}

export interface StravaSegmentEffort {
  id: number;
  name: string;
  elapsed_time: number;
  moving_time?: number;
  start_date: string;
  start_date_local: string;
  distance?: number;
  average_watts?: number | null;
  average_heartrate?: number | null;
  max_heartrate?: number | null;
  pr_rank?: number | null;
  segment?: {
    id: number;
    name: string;
  };
}

export interface StravaActivity {
  id: number;
  name: string;
  type?: string;
  sport_type?: string;
  start_date: string;
  start_date_local: string;
  distance: number;
  moving_time: number;
  elapsed_time?: number;
  total_elevation_gain: number;
  average_heartrate?: number | null;
  max_heartrate?: number | null;
  suffer_score?: number | null;
  average_watts?: number | null;
}
