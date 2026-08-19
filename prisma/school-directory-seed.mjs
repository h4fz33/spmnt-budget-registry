import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

export const SCHOOL_DIRECTORY_ROW_COUNT = 17
export const SCHOOL_DIRECTORY_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../data/schools.csv",
)

export const PILOT_ESAO = Object.freeze({
  code: "1000960001",
  organizationId: "10009600-0001-5000-8000-000000000001",
  nameTh: "สำนักงานเขตพื้นที่การศึกษามัธยมศึกษานราธิวาส",
  nameEn: "Secondary Educational Service Area Office Narathiwat",
})

const expectedHeaders = ["schoolName", "smis_code", "moe_code"]
const smisCodePattern = /^\d{8}$/
const moeCodePattern = /^\d{10}$/

export class SchoolDirectorySeedError extends Error {}

export class SchoolDirectoryDifferenceError extends SchoolDirectorySeedError {
  constructor(differences) {
    super(`School Directory seed differences detected:\n${differences.map((difference) => `- ${difference}`).join("\n")}`)
    this.name = "SchoolDirectoryDifferenceError"
    this.differences = Object.freeze([...differences])
  }
}

function invalidDirectory(message) {
  return new SchoolDirectorySeedError(`Invalid School Directory CSV: ${message}`)
}

function parseCsvRecords(text) {
  const rows = []
  let row = []
  let field = ""
  let quoted = false
  let justClosedQuote = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]

    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"'
          index += 1
        } else {
          quoted = false
          justClosedQuote = true
        }
      } else {
        field += character
      }
      continue
    }

    if (justClosedQuote && character !== "," && character !== "\n" && character !== "\r") {
      throw invalidDirectory("a quoted field contains trailing characters")
    }

    if (character === '"') {
      if (field.length > 0) {
        throw invalidDirectory("a quote appears inside an unquoted field")
      }
      quoted = true
      justClosedQuote = false
    } else if (character === ",") {
      row.push(field)
      field = ""
      justClosedQuote = false
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") {
        index += 1
      }
      row.push(field)
      rows.push(row)
      row = []
      field = ""
      justClosedQuote = false
    } else {
      field += character
      justClosedQuote = false
    }
  }

  if (quoted) {
    throw invalidDirectory("an unterminated quoted field is present")
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}

function validateSchoolRows(rows) {
  if (!Array.isArray(rows) || rows.length !== SCHOOL_DIRECTORY_ROW_COUNT) {
    throw invalidDirectory(`expected exactly ${SCHOOL_DIRECTORY_ROW_COUNT} school rows`)
  }

  const seen = new Map([
    ["schoolName", new Map()],
    ["smisCode", new Map()],
    ["moeCode", new Map()],
  ])

  return Object.freeze(
    rows.map((row, index) => {
      const line = index + 2
      const schoolName = typeof row?.schoolName === "string" ? row.schoolName : ""
      const smisCode = typeof row?.smisCode === "string" ? row.smisCode : ""
      const moeCode = typeof row?.moeCode === "string" ? row.moeCode : ""

      if (!schoolName || !smisCode || !moeCode) {
        throw invalidDirectory(`row ${line} must contain schoolName, smis_code, and moe_code`)
      }

      if (schoolName !== schoolName.trim() || /[\r\n]/.test(schoolName)) {
        throw invalidDirectory(`row ${line} schoolName must be a trimmed single-line value`)
      }

      if (smisCode !== smisCode.trim() || !smisCodePattern.test(smisCode)) {
        throw invalidDirectory(`row ${line} smis_code must be an 8-digit string`)
      }

      if (moeCode !== moeCode.trim() || !moeCodePattern.test(moeCode)) {
        throw invalidDirectory(`row ${line} moe_code must be a 10-digit string`)
      }

      const normalized = Object.freeze({ schoolName, smisCode, moeCode })
      for (const [field, values] of seen) {
        const value = normalized[field]
        const priorLine = values.get(value)
        if (priorLine) {
          throw invalidDirectory(`row ${line} duplicates ${field} from row ${priorLine}`)
        }
        values.set(value, line)
      }

      return normalized
    }),
  )
}

export function parseSchoolDirectoryCsv(bytes) {
  let text
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
  } catch {
    throw invalidDirectory("file must be valid UTF-8")
  }

  const records = parseCsvRecords(text.replace(/^\uFEFF/, ""))
  while (records.at(-1)?.length === 1 && records.at(-1)[0] === "") {
    records.pop()
  }
  const [headers, ...dataRows] = records
  if (!headers || headers.length !== expectedHeaders.length || !headers.every((header, index) => header === expectedHeaders[index])) {
    throw invalidDirectory(`expected header ${expectedHeaders.join(",")}`)
  }

  if (dataRows.some((row) => row.length !== expectedHeaders.length)) {
    throw invalidDirectory("every row must have exactly three columns")
  }

  return validateSchoolRows(
    dataRows.map(([schoolName, smisCode, moeCode]) => ({ schoolName, smisCode, moeCode })),
  )
}

export async function loadSchoolDirectory(csvPath = SCHOOL_DIRECTORY_PATH) {
  const bytes = await readFile(csvPath)
  return parseSchoolDirectoryCsv(bytes)
}

export function getPilotEsao(esaoCode) {
  if (esaoCode !== PILOT_ESAO.code) {
    throw new SchoolDirectorySeedError(
      `SCHOOL_SEED_ESAO_CODE must be the approved pilot ESAO code ${PILOT_ESAO.code}`,
    )
  }

  return PILOT_ESAO
}

function summarizeOrganizationDifferences(organization, expected, label) {
  const differences = []
  const fields = [
    ["type", expected.type],
    ["status", "ACTIVE"],
    ["nameTh", expected.nameTh],
    ["nameEn", expected.nameEn],
    ["parentOrganizationId", expected.parentOrganizationId],
  ]

  for (const [field, value] of fields) {
    if (organization[field] !== value) {
      differences.push(`${label} ${field} is ${JSON.stringify(organization[field])}; expected ${JSON.stringify(value)}`)
    }
  }

  return differences
}

export async function applySchoolDirectorySeed(transaction, { directory, esaoCode }) {
  const rows = validateSchoolRows(directory)
  const esao = getPilotEsao(esaoCode)
  const differences = []
  const existingEsao = await transaction.organization.findUnique({ where: { id: esao.organizationId } })

  if (existingEsao) {
    differences.push(
      ...summarizeOrganizationDifferences(
        existingEsao,
        { ...esao, type: "ESAO", parentOrganizationId: null },
        `ESAO ${esao.code}`,
      ),
    )
  }

  const existingSchools = await transaction.school.findMany({
    where: {
      OR: [
        { smisCode: { in: rows.map((row) => row.smisCode) } },
        { moeCode: { in: rows.map((row) => row.moeCode) } },
      ],
    },
    include: { organization: true },
  })
  const schoolsByMoeCode = new Map(existingSchools.map((school) => [school.moeCode, school]))
  const schoolsBySmisCode = new Map(existingSchools.map((school) => [school.smisCode, school]))

  for (const row of rows) {
    const schoolByMoeCode = schoolsByMoeCode.get(row.moeCode)
    const schoolBySmisCode = schoolsBySmisCode.get(row.smisCode)

    if (schoolByMoeCode) {
      if (schoolByMoeCode.smisCode !== row.smisCode) {
        differences.push(
          `School MOE ${row.moeCode} smisCode is ${JSON.stringify(schoolByMoeCode.smisCode)}; expected ${JSON.stringify(row.smisCode)}`,
        )
      }
      if (!schoolByMoeCode.directoryIsActive) {
        differences.push(`School MOE ${row.moeCode} directoryIsActive is false; expected true`)
      }
      differences.push(
        ...summarizeOrganizationDifferences(
          schoolByMoeCode.organization,
          {
            type: "SCHOOL",
            nameTh: row.schoolName,
            nameEn: null,
            parentOrganizationId: esao.organizationId,
          },
          `School MOE ${row.moeCode}`,
        ),
      )
    } else if (schoolBySmisCode) {
      differences.push(
        `School SMIS ${row.smisCode} already belongs to MOE ${schoolBySmisCode.moeCode}; expected ${row.moeCode}`,
      )
    }
  }

  if (differences.length > 0) {
    throw new SchoolDirectoryDifferenceError(differences)
  }

  const parent = await transaction.organization.upsert({
    where: { id: esao.organizationId },
    create: {
      id: esao.organizationId,
      type: "ESAO",
      status: "ACTIVE",
      nameTh: esao.nameTh,
      nameEn: esao.nameEn,
    },
    update: {},
  })

  let createdSchoolCount = 0
  for (const row of rows) {
    if (schoolsByMoeCode.has(row.moeCode)) {
      continue
    }

    const organization = await transaction.organization.create({
      data: {
        type: "SCHOOL",
        status: "ACTIVE",
        nameTh: row.schoolName,
        parentOrganizationId: parent.id,
      },
    })
    await transaction.school.upsert({
      where: { moeCode: row.moeCode },
      create: {
        organizationId: organization.id,
        smisCode: row.smisCode,
        moeCode: row.moeCode,
        directoryIsActive: true,
      },
      update: {},
    })
    createdSchoolCount += 1
  }

  return Object.freeze({
    esaoOrganizationId: parent.id,
    createdSchoolCount,
    unchangedSchoolCount: rows.length - createdSchoolCount,
  })
}

export async function seedSchoolDirectory(client, { directory, esaoCode } = {}) {
  const resolvedDirectory = directory ? validateSchoolRows(directory) : await loadSchoolDirectory()

  return client.$transaction((transaction) =>
    applySchoolDirectorySeed(transaction, { directory: resolvedDirectory, esaoCode }),
  )
}
