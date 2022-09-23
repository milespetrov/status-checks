import exec from '@actions/exec'
import {info, warning} from '@actions/core'
import type {ActionInterface, LintResults} from './constants.js'

export async function run(action: ActionInterface): Promise<LintResults> {
  let results = await lintCheck(action.inputs.lintCommand)
  info(`Lint Results: ${results.errors} errors, ${results.warnings} warnings`)

  if (action.inputs.compare && action.isPR) {
    results = await compareOutput(results, action)
  }

  if (
    results.errors > action.inputs.lintErrors ||
    results.warnings > action.inputs.lintWarnings
  ) {
    results.failed = true
    warning('Lint check failed!')
  } else {
    info(`Lint check has passed!`)
  }
  return results
}

async function compareOutput(
  results: LintResults,
  action: ActionInterface
): Promise<LintResults> {
  if (action.previousResults) {
    info(
      `Previous Lint Results: ${action.previousResults.lint.errors} errors, ${action.previousResults.lint.warnings} warnings`
    )
    return {
      errors: results.errors - action.previousResults.lint.errors,
      warnings: results.warnings - action.previousResults.lint.warnings,
      failed: results.failed
    }
  }
  return results
}

async function lintCheck(command: string): Promise<LintResults> {
  const result = await exec.getExecOutput(command, [], {
    ignoreReturnCode: true
  })

  const regex = /\((\d+) errors, (\d+) warnings\)/gm
  let m
  let output: LintResults = {errors: 0, warnings: 0, failed: false}

  if ((m = regex.exec(result.stdout)) !== null) {
    output.errors = parseInt(m[1])
    output.warnings = parseInt(m[2])
  }
  return output
}
