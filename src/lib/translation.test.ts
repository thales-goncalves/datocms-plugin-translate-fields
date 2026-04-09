import { getTranslation, getStructuredTextTranslation } from './translation'
import { TranslationFormat, TranslationService } from './types'

const tranlationOptions = {
  fromLocale: 'nl',
  toLocale: 'en',
  format: TranslationFormat.plain,
  translationService: TranslationService.mock,
  apiKey: '',
  openAIOptions: {
    model: 'text-davinci-003',
    temperature: 0,
    maxCompletionTokens: 100,
    topP: 0,
    prompt:
      "Translate the following from the locale '{{fromLocale}}' to the locale '{{toLocale}}': {{value}}",
  },
}

const translatedText = 'Translated test'

const fetchMock = jest.fn()
const setFetchReturnValue = (value: unknown) => {
  fetchMock.mockReset()
  fetchMock.mockImplementation(() =>
    Promise.resolve({
      json: () => Promise.resolve(value),
      status: 200,
    }),
  )
}
global.fetch = fetchMock

describe('getTranslation', () => {
  it('should return translation', async () => {
    const translation = await getTranslation('test', tranlationOptions)
    expect(translation).toStrictEqual(translatedText)
  })

  it('should return translation with yandex response', async () => {
    setFetchReturnValue({ text: [translatedText] })
    expect.assertions(1)

    const translation = await getTranslation('test', {
      ...tranlationOptions,
      translationService: TranslationService.yandex,
    })
    expect(translation).toStrictEqual(translatedText)
  })

  it('should return translation with deepl response', async () => {
    setFetchReturnValue({ translations: [{ text: translatedText }] })

    const translation = await getTranslation('test', {
      ...tranlationOptions,
      translationService: TranslationService.deepl,
    })
    expect(translation).toStrictEqual(translatedText)
  })

  it('should return translation with deepl free response', async () => {
    setFetchReturnValue({ translations: [{ text: translatedText }] })

    const translation = await getTranslation('test', {
      ...tranlationOptions,
      translationService: TranslationService.deeplFree,
    })
    expect(translation).toStrictEqual(translatedText)
  })

  it('should return translation with openAI response', async () => {
    setFetchReturnValue({
      choices: [{ message: { content: translatedText } }],
    })

    const translation = await getTranslation('test', {
      ...tranlationOptions,
      translationService: TranslationService.openAI,
    })
    expect(translation).toStrictEqual(translatedText)
  })

  it('should return translation with yandex response', async () => {
    setFetchReturnValue({ text: [translatedText] })
    await expect(() =>
      getTranslation('test', {
        ...tranlationOptions,
        translationService: 'test' as TranslationService,
      }),
    ).rejects.toThrow('No translation service added in the settings')
  })
})

describe('getStructuredTextTranslation', () => {
  it('should translate text spans containing soft line breaks', async () => {
    const slateValue = [
      {
        type: 'paragraph',
        children: [
          {
            text: 'Line one\nLine two\nLine three',
          },
        ],
      },
    ]

    const result = await getStructuredTextTranslation(
      slateValue,
      tranlationOptions,
    )

    expect(result[0].children[0].text).toBe(
      'Translated Line one\nLine two\nLine three',
    )
  })

  it('should translate simple text spans', async () => {
    const slateValue = [
      {
        type: 'paragraph',
        children: [
          {
            text: 'Hello world',
          },
        ],
      },
    ]

    const result = await getStructuredTextTranslation(
      slateValue,
      tranlationOptions,
    )

    expect(result[0].children[0].text).toBe('Translated Hello world')
  })

  it('should translate text inside link nodes', async () => {
    const slateValue = [
      {
        type: 'paragraph',
        children: [
          { text: 'Click ' },
          {
            type: 'link',
            url: 'https://example.com',
            children: [{ text: 'here' }],
          },
          { text: ' please' },
        ],
      },
    ]

    const result = await getStructuredTextTranslation(
      slateValue,
      tranlationOptions,
    )

    expect(result[0].children[0].text).toBe('Translated Click ')
    expect(result[0].children[1].children[0].text).toBe('Translated here')
    expect(result[0].children[1].url).toBe('https://example.com')
    expect(result[0].children[2].text).toBe('Translated  please')
  })
})
