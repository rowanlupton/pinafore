import { store } from '../_store/store'
import { toast } from '../_utils/toast'
import { postStatus as postStatusToServer } from '../_api/statuses'
import { addStatusOrNotification } from './addStatusOrNotification'
import { getStatus as getStatusFromDatabase } from '../_database/timelines/getStatusOrNotification'
import { emit } from '../_utils/eventBus'
import { putMediaDescription } from '../_api/media'

export async function insertHandleForReply (statusId) {
  let { currentInstance } = store.get()
  let status = await getStatusFromDatabase(currentInstance, statusId)
  let { currentVerifyCredentials } = store.get()
  let originalStatus = status.reblog || status
  let accounts = [originalStatus.account].concat(originalStatus.mentions || [])
    .filter(account => account.id !== currentVerifyCredentials.id)
  if (!store.getComposeData(statusId, 'text') && accounts.length) {
    store.setComposeData(statusId, {
      text: accounts.map(account => `@${account.acct} `).join('')
    })
  }
}

export async function postStatus (realm, text, inReplyToId, mediaIds,
  sensitive, spoilerText, visibility,
  mediaDescriptions = [], inReplyToUuid) {
  let { currentInstance, accessToken, online } = store.get()

  if (!online) {
    toast.say('You cannot post while offline')
    return
  }

  store.set({
    postingStatus: true
  })
  try {
    await Promise.all(mediaDescriptions.map(async (description, i) => {
      return description && putMediaDescription(currentInstance, accessToken, mediaIds[i], description)
    }))
    let status = await postStatusToServer(currentInstance, accessToken, text,
      inReplyToId, mediaIds, sensitive, spoilerText, visibility)
    addStatusOrNotification(currentInstance, 'home', status)
    store.clearComposeData(realm)
    emit('postedStatus', realm, inReplyToUuid)
  } catch (e) {
    console.error(e)
    toast.say('Unable to post status: ' + (e.message || ''))
  } finally {
    store.set({postingStatus: false})
  }
}

export async function insertUsername (realm, username, startIndex, endIndex) {
  let oldText = store.getComposeData(realm, 'text')
  let pre = oldText.substring(0, startIndex)
  let post = oldText.substring(endIndex)
  let newText = `${pre}@${username} ${post}`
  store.setComposeData(realm, {text: newText})
}

export async function clickSelectedAutosuggestionUsername (realm) {
  let {
    composeSelectionStart,
    composeAutosuggestionSearchText,
    composeAutosuggestionSelected,
    composeAutosuggestionSearchResults
  } = store.get()
  composeAutosuggestionSelected = composeAutosuggestionSelected || 0
  let account = composeAutosuggestionSearchResults[composeAutosuggestionSelected]
  let startIndex = composeSelectionStart - composeAutosuggestionSearchText.length
  let endIndex = composeSelectionStart
  await insertUsername(realm, account.acct, startIndex, endIndex)
}

export function setReplySpoiler (realm, spoiler) {
  let contentWarning = store.getComposeData(realm, 'contentWarning')
  let contentWarningShown = store.getComposeData(realm, 'contentWarningShown')
  if (typeof contentWarningShown !== 'undefined' || contentWarning) {
    return // user has already interacted with the CW
  }
  store.setComposeData(realm, {
    contentWarning: spoiler,
    contentWarningShown: true
  })
}

const PRIVACY_LEVEL = {
  'direct': 1,
  'private': 2,
  'unlisted': 3,
  'public': 4
}

export function setReplyVisibility (realm, replyVisibility) {
  // return the most private between the user's preferred default privacy
  // and the privacy of the status they're replying to
  let postPrivacy = store.getComposeData(realm, 'postPrivacy')
  if (typeof postPrivacy !== 'undefined') {
    return // user has already set the postPrivacy
  }
  let { currentVerifyCredentials } = store.get()
  let defaultVisibility = currentVerifyCredentials.source.privacy
  let visibility = PRIVACY_LEVEL[replyVisibility] < PRIVACY_LEVEL[defaultVisibility]
    ? replyVisibility
    : defaultVisibility
  store.setComposeData(realm, {postPrivacy: visibility})
}
