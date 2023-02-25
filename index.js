#!/usr/bin/env node
const arg = require('arg')
const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')
const shell = require('shelljs')

const cwd = process.cwd()
const binArgsEndIndex = process.argv.find((arg) => arg === '--') ? 3 : 2

const AUTODIFFGIST_TEMP_DIR = '__AUTODIFFGIST__'

let rawArgs

try {
    rawArgs = arg(
        {
            '--desc': String,
            '--public': Boolean,
            '--verbose': Boolean,
            '--web': Boolean,
            '-d': '--desc',
            '-p': '--public',
            '-v': '--verbose',
            '-w': '--web',
        },
        {
            argv: process.argv.slice(binArgsEndIndex),
        }
    )
} catch (err) {
    console.log(`${chalk.red.bold('ERR')} Could not parse arguments: ${err}`)

    process.exit(1)
}

const shouldBeVerbose = Boolean(rawArgs['--verbose'])

shell.config.silent = !shouldBeVerbose
shell.config.verbose = shouldBeVerbose

const isAuthentificated = shell.exec('gh auth status --hostname github.com').code === 0

if (!isAuthentificated) {
    console.log(
        `${chalk.red.bold(
            'ERR'
        )} There are no GitHub CLI installed or you are not logged in. Please, follow this manual before using Autodiffgist: https://cli.github.com/manual/`
    )

    process.exit(1)
}

const parsedArgs = Object.entries(rawArgs)
    .slice(1)
    .filter(([key]) => key !== '--verbose')
    .map(([key, value]) => {
        if (value === true) {
            return key
        }

        return `${key} "${value}"`
    })
    .join(' ')

const getFilePath = (name) => path.resolve(cwd, name)

// 1. Create temp folder
if (fs.existsSync(AUTODIFFGIST_TEMP_DIR)) {
    rimraf.sync(AUTODIFFGIST_TEMP_DIR)
}

fs.mkdirSync(AUTODIFFGIST_TEMP_DIR)

// 2. Stage all files
shell.exec(`git add ${cwd}`)

// 3. Get staged files' names and their statuses
const stagedFiles = []
const diffStatusFilePath = getFilePath(`${AUTODIFFGIST_TEMP_DIR}/status.diff`)

shell.exec(`git diff --cached --name-status ${cwd} > ${diffStatusFilePath}`)

let diffStatusData

try {
    diffStatusData = fs.readFileSync(diffStatusFilePath).toString()
} catch (err) {
    console.log(
        `${chalk.red.bold('ERR')} Can not read diff status file ${diffStatusFilePath}: ${err}`
    )

    rimraf.sync(AUTODIFFGIST_TEMP_DIR)

    process.exit(1)
}

;(diffStatusData.split('\n') || []).forEach((diffEntry) => {
    const [status, name] = diffEntry.split('\t')

    if (name && status) {
        stagedFiles.push({ name, status })
    }
})

// 4. Loop through files and handle them regarding their diff status
// A — use the file as is
// M — save the result of git diff to its own file with .diff extension in the temp folder
const gistFiles = []

stagedFiles.forEach(({ name, status }) => {
    switch (status) {
        case 'A':
            let fileData

            try {
                fileData = fs.readFileSync(getFilePath(name))
            } catch (err) {
                console.log(
                    `${chalk.red.bold('ERR')} Can not read added file ${diffStatusFilePath}: ${err}`
                )

                rimraf.sync(AUTODIFFGIST_TEMP_DIR)

                process.exit(1)
            }

            if (fileData.length === 0) {
                console.log(
                    `${chalk.yellow.bold('WARN')} Empty files can not be added to gist: ${name}`
                )

                return
            }

            gistFiles.push(getFilePath(name))

            break
        case 'M':
            const diffFilePath = getFilePath(`${AUTODIFFGIST_TEMP_DIR}/${name}.diff`)

            shell.exec(`git diff --cached -U1000 ${name}| tail -n +6 > ${diffFilePath}`)

            gistFiles.push(diffFilePath)

            break
        default:
            break
    }
})

// 5. Use gh gist create command will all gist material files and temp folder files
if (gistFiles.length === 0) {
    console.log(`${chalk.yellow.bold('WARN')} There are no files to create gist with`)
} else {
    const { code, stderr, stdout } = shell.exec(
        `gh gist create ${gistFiles.join(' ')} ${parsedArgs}`
    )

    if (code !== 0) {
        console.log(`${chalk.red.bold('ERR')} Could not create gist: ${stderr}`)
    } else {
        console.log(`${chalk.green.bold('SUCCESS')} Gist was created successfully: ${stdout}`)
    }
}

// 6. Cleanup
rimraf.sync(AUTODIFFGIST_TEMP_DIR)
