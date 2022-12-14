import exec from '@actions/exec'
import {info, warning, startGroup, endGroup, notice} from '@actions/core'
import type {ActionInterface, TypeScriptResults} from './constants.js'

export async function run(action: ActionInterface): Promise<TypeScriptResults> {
  const results = await tsCheck(action.inputs.tsCommand)
  let errorCount = results.errors

  if (action.inputs.compare && action.isPR) {
    errorCount = await compareErrors(errorCount, action)
  }

  info(`Error count: ${errorCount} \n Action Errors: ${action.inputs.tsErrors}`)
  if (errorCount > action.inputs.tsErrors) {
    results.failed = true
    warning('TypeScript check failed!')
  } else {
    notice(`Typescript check has passed!`)
  }
  return results
}

async function compareErrors(
  errorCount: number,
  action: ActionInterface
): Promise<number> {
  if (action.previousResults) {
    info(`Previous errors: ${action.previousResults.ts.errors}`)
    return errorCount - action.previousResults.ts.errors
  }
  return errorCount
}

async function tsCheck(command: string): Promise<TypeScriptResults> {
  const result = await exec.getExecOutput(command, [], {
    ignoreReturnCode: true,
    silent: true
  })
  startGroup('TypeScript Output')
  console.log(result.stdout)
  console.log(result.stderr)
  endGroup()

  const regex = /Found (\d+) errors?( in (\d+) files?)?/gm
  let m
  let output: TypeScriptResults = {errors: 0, files: 0, failed: false}

  if ((m = regex.exec(result.stdout)) !== null) {
    output.errors = parseInt(m[1])
    output.files = parseInt(m[2])
  }
  return output
}
