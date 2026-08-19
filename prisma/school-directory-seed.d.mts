export type SchoolDirectoryRow = Readonly<{
  schoolName: string
  smisCode: string
  moeCode: string
}>

export type SchoolDirectorySeedResult = Readonly<{
  esaoOrganizationId: string
  createdSchoolCount: number
  unchangedSchoolCount: number
}>

export declare const SCHOOL_DIRECTORY_ROW_COUNT: 17
export declare const SCHOOL_DIRECTORY_PATH: string
export declare const PILOT_ESAO: Readonly<{
  code: "1000960001"
  organizationId: string
  nameTh: string
  nameEn: string
}>

export declare class SchoolDirectorySeedError extends Error {}

export declare class SchoolDirectoryDifferenceError extends SchoolDirectorySeedError {
  readonly differences: readonly string[]
}

export declare function parseSchoolDirectoryCsv(bytes: AllowSharedBufferSource): readonly SchoolDirectoryRow[]
export declare function loadSchoolDirectory(csvPath?: string): Promise<readonly SchoolDirectoryRow[]>
export declare function getPilotEsao(esaoCode: string | undefined): typeof PILOT_ESAO
export declare function applySchoolDirectorySeed(
  transaction: object,
  input: { directory: readonly SchoolDirectoryRow[]; esaoCode: string | undefined },
): Promise<SchoolDirectorySeedResult>
export declare function seedSchoolDirectory(
  client: object,
  input?: { directory?: readonly SchoolDirectoryRow[]; esaoCode?: string },
): Promise<SchoolDirectorySeedResult>
