const SemanticReleaseError = require('@semantic-release/error')
const fetch = require('node-fetch')
const pLimit = require('p-limit')

const REGEXP_ISSUE = new RegExp(`\\bSENTRY-(\\d+)\\b`, 'giu')

exports.verifyConditions = async function verifyConditions(config) {
  if (typeof config.sentryTokenVar !== 'string') {
    throw new SemanticReleaseError(`config.sentryTokenVar must be a string`);
  }

  if (typeof process.env[config.sentryTokenVar] !== 'string') {
    throw new SemanticReleaseError(`process.env.${config.sentryTokenVar} must be a string`);
  }

  if (typeof config.networkConcurrency !== 'undefined' && typeof config.networkConcurrency !== 'number') {
    throw new SemanticReleaseError(`config.networkConcurrency must be integer greater than 0`);
  }
}

function getIssuesFromCommits (context) {
  const issues = []

  for (const commit of context.commits) {
    const matches = commit.message.match(REGEXP_ISSUE) || [];

    for (const match of matches) {
      issues.push(match);
      context.logger.info(`Found Sentry issue ${match} in commit: ${commit.commit.short}`);
    }
  }

  return issues
}

async function setIssueAsResolved (config, context, issueId) {
  let response
  const { logger } = context

  try {
    response = await fetch(`https://sentry.io/api/0/issues/${issueId}/`, {
      method: 'PUT',
      body: `{"status":"resolvedInNextRelease"}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env[config.sentryTokenVar]}`
      }
    })
  } catch (error) {
    console.error(error)
    logger.error(`Network problem, unable to update Sentry issue ${issueId}`);
    return
  }

  if (response.status >= 200 && response.status < 300) {
    logger.success(`Sentry issue ${issueId} status set to "resolvedInNextRelease"`);
    return
  }

  try {
    console.error(await response.text())
  } catch (error) {}

  logger.error(`Http failed "${response.statusText}", unable to update Sentry issue ${issueId}`);
}

exports.success = async function success(config, context) {
  const limitConcurrency = pLimit(config.networkConcurrency || 20)
  const issues = getIssuesFromCommits(context)
  const promises = issues.map(issueId => limitConcurrency(() => setIssueAsResolved(config, context, issueId)))

  return Promise.all(promises)
}
