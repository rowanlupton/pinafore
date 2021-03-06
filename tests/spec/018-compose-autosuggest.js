import {
  composeInput, getNthAutosuggestionResult
} from '../utils'
import { foobarRole } from '../roles'

fixture`018-compose-autosuggest.js`
  .page`http://localhost:4002`

test('autosuggests user handles', async t => {
  await t.useRole(foobarRole)
    .hover(composeInput)
    .typeText(composeInput, 'hey @qu')
    .click(getNthAutosuggestionResult(1))
    .expect(composeInput.value).eql('hey @quux ')
    .typeText(composeInput, 'and also @adm')
    .click(getNthAutosuggestionResult(1))
    .expect(composeInput.value).eql('hey @quux and also @admin ')
    .typeText(composeInput, 'and also @AdM')
    .expect(getNthAutosuggestionResult(1).innerText).contains('@admin')
    .pressKey('tab')
    .expect(composeInput.value).eql('hey @quux and also @admin and also @admin ')
    .typeText(composeInput, 'and @QU')
    .expect(getNthAutosuggestionResult(1).innerText).contains('@quux')
    .pressKey('enter')
    .expect(composeInput.value).eql('hey @quux and also @admin and also @admin and @quux ')
})

test('autosuggests custom emoji', async t => {
  await t.useRole(foobarRole)
    .hover(composeInput)
    .typeText(composeInput, ':blob')
    .click(getNthAutosuggestionResult(1))
    .expect(composeInput.value).eql(':blobnom: ')
    .typeText(composeInput, 'and :blob')
    .expect(getNthAutosuggestionResult(1).innerText).contains(':blobnom:')
    .expect(getNthAutosuggestionResult(2).innerText).contains(':blobpats:')
    .expect(getNthAutosuggestionResult(3).innerText).contains(':blobpeek:')
    .pressKey('down')
    .pressKey('down')
    .pressKey('enter')
    .expect(composeInput.value).eql(':blobnom: and :blobpeek: ')
    .typeText(composeInput, 'and also :blobpa')
    .expect(getNthAutosuggestionResult(1).innerText).contains(':blobpats:')
    .pressKey('tab')
    .expect(composeInput.value).eql(':blobnom: and :blobpeek: and also :blobpats: ')
})

test('autosuggest custom emoji works with regular emoji - keyboard', async t => {
  await t.useRole(foobarRole)
    .hover(composeInput)
    .typeText(composeInput, '\ud83c\udf4d :blobno')
    .expect(getNthAutosuggestionResult(1).innerText).contains(':blobnom:')
    .pressKey('enter')
    .expect(composeInput.value).eql('\ud83c\udf4d :blobnom: ')
})

test('autosuggest custom emoji works with regular emoji - clicking', async t => {
  await t.useRole(foobarRole)
    .hover(composeInput)
    .typeText(composeInput, '\ud83c\udf4d :blobno')
    .expect(getNthAutosuggestionResult(1).innerText).contains(':blobnom:')
    .click(getNthAutosuggestionResult(1))
    .expect(composeInput.value).eql('\ud83c\udf4d :blobnom: ')
})

test('autosuggest handles works with regular emoji - keyboard', async t => {
  await t.useRole(foobarRole)
    .hover(composeInput)
    .typeText(composeInput, '\ud83c\udf4d @quu')
    .expect(getNthAutosuggestionResult(1).innerText).contains('@quux')
    .pressKey('enter')
    .expect(composeInput.value).eql('\ud83c\udf4d @quux ')
})

test('autosuggest handles works with regular emoji - clicking', async t => {
  await t.useRole(foobarRole)
    .hover(composeInput)
    .typeText(composeInput, '\ud83c\udf4d @quu')
    .expect(getNthAutosuggestionResult(1).innerText).contains('@quux')
    .click(getNthAutosuggestionResult(1))
    .expect(composeInput.value).eql('\ud83c\udf4d @quux ')
})
