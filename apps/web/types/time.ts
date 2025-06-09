export enum DaysOfWeek {
  Monday = 'monday',
  Tuesday = 'tuesday',
  Wednesday = 'wednesday',
  Thursday = 'thursday',
  Friday = 'friday',
  Saturday = 'saturday',
  Sunday = 'sunday',
}

export enum Hours {
  '_00' = '00',
  '_01' = '01',
  '_02' = '02',
  '_03' = '03',
  '_04' = '04',
  '_05' = '05',
  '_06' = '06',
  '_07' = '07',
  '_08' = '08',
  '_09' = '09',
  '_10' = '10',
  '_11' = '11',
  '_12' = '12',
  '_13' = '13',
  '_14' = '14',
  '_15' = '15',
  '_16' = '16',
  '_17' = '17',
  '_18' = '18',
  '_19' = '19',
  '_20' = '20',
  '_21' = '21',
  '_22' = '22',
  '_23' = '23',
}

export enum Minutes {
  '_00' = '00',
  '_15' = '15',
  '_30' = '30',
  '_45' = '45',
  '_59' = '59',
}

export interface TimeValue {
  hour: Hours;
  minute: Minutes;
}
