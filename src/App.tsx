import padStart from 'lodash/padStart'
import { useState } from 'react'
import ReactDOMServer from 'react-dom/server'
import { html as beautifyHtml } from 'js-beautify'
import './App.css'

import { type StateValue, useStateStorage } from './state'

const defaultContent: Content = {
  type: 'content',
  children: [
    {
      type: 'text-block',
      children: [
        {
          type: 'paragraph',
          content: { type: 'text', text: 'Welcome! This is a simple editor' },
        },
        {
          type: 'paragraph',
          content: {
            type: 'text',
            text: 'An example of a multiple-choice exercise:',
          },
        },
      ],
    },
    {
      type: 'mutiple-choice-exercise',
      question: {
        type: 'text-block',
        children: [
          {
            type: 'paragraph',
            content: {
              type: 'text',
              text: 'What is React primarily used for?',
            },
          },
        ],
      },
      answers: [
        {
          text: { type: 'text', text: 'Building user interfaces' },
          isCorrect: true,
        },
        {
          text: { type: 'text', text: 'Managing databases' },
          isCorrect: false,
        },
        {
          text: { type: 'text', text: 'Writing server-side code' },
          isCorrect: false,
        },
      ],
    },
  ],
}

const optionTypes = ['state', 'entries', 'html'] as const
type Option = (typeof optionTypes)[number]

const optionLabels: Record<Option, string> = {
  state: 'External State',
  entries: 'Internal Storage Entries',
  html: 'HTML Output',
}

export default function App() {
  const { storage } = useStateStorage(defaultContent)
  const [options, showOptions] = useState<Record<Option, boolean>>({
    state: true,
    entries: true,
    html: true,
  })

  const state = storage.getRootValue()

  return (
    <main className="prose p-10">
      <div className="max-w-xl">
        <h1>Editor:</h1>
        {renderContent(state)}
      </div>
      <h2>Debug Panel:</h2>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Options</legend>
        {optionTypes.map((optionType) => (
          <label key={optionType} className="label">
            <input
              type="checkbox"
              className="toggle"
              checked={options[optionType]}
              onChange={() =>
                showOptions((prev) => ({
                  ...prev,
                  [optionType]: !prev[optionType],
                }))
              }
            />{' '}
            {optionLabels[optionType]}
          </label>
        ))}
      </fieldset>
      <div className="flex gap-4">
        {optionTypes.map((optionType) =>
          options[optionType] ? (
            <pre className="max-w-xl h-132" key={optionType}>
              {getDebugView(optionType as Option)}
            </pre>
          ) : null,
        )}
      </div>
    </main>
  )

  function getDebugView(option: Option) {
    switch (option) {
      case 'state':
        return JSON.stringify(state.read(), null, 2)
      case 'entries':
        return storage
          .getEntries()
          .map(
            ([key, entry]) =>
              `${padStart(key, 4)}: ${JSON.stringify(entry.value)}`,
          )
          .join('\n')
      case 'html':
        return beautifyHtml(
          ReactDOMServer.renderToStaticMarkup(renderContent(state)),
          { indent_size: 2, wrap_line_length: 70 },
        )
    }
  }
}

function render(element: StateValue<{ type: string }>) {
  switch (element.get('type').getValue()) {
    case 'content':
      return renderContent(element as StateValue<Content>)
    case 'mutiple-choice-exercise':
      return renderMultipleChoiceQuestion(
        element as StateValue<MutipleChoiceExercise>,
      )
    case 'text-block':
      return renderTextBlock(element as StateValue<TextBlock>)
    case 'text':
      return renderText(element as StateValue<Text>)
    case 'paragraph':
      return renderParagraph(element as StateValue<Paragraph>)
    default:
      return null
  }
}

function renderContent(content: StateValue<Content>) {
  return (
    <section
      key={content.getKey()}
      data-key={content.getKey()}
      className="rounded-xl border-2 p-4"
    >
      {content.get('children').map((child) => render(child))}
    </section>
  )
}

function renderMultipleChoiceQuestion(
  exercise: StateValue<MutipleChoiceExercise>,
) {
  return (
    <div
      key={exercise.getKey()}
      data-key={exercise.getKey()}
      className="card bg-info-content"
    >
      <div className="card-body">
        <h2 className="card-title">Multiple Choice Question</h2>
        {renderTextBlock(exercise.get('question'))}
        <ul className="list-none pl-0 mt-0">
          {exercise.get('answers').map((answer) => (
            <li key={answer.getKey()}>
              <input
                type="checkbox"
                className="checkbox mr-4"
                checked={answer.get('isCorrect').getValue()}
                onChange={() => {}}
              />
              {render(answer.get('text'))}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function renderTextBlock(text: StateValue<TextBlock>) {
  return (
    <div key={text.getKey()} data-key={text.getKey()} className="text-block">
      {text.get('children').map(renderParagraph)}
    </div>
  )
}

function renderParagraph(paragraph: StateValue<Paragraph>) {
  return (
    <p key={paragraph.getKey()} data-key={paragraph.getKey()}>
      {renderText(paragraph.get('content'))}
    </p>
  )
}

function renderText(text: StateValue<Text>) {
  return (
    <span key={text.getKey()} data-key={text.getKey()}>
      {text.get('text').getValue()}
    </span>
  )
}

interface Content {
  type: 'content'
  children: (TextBlock | MutipleChoiceExercise)[]
}

interface MutipleChoiceExercise {
  type: 'mutiple-choice-exercise'
  question: TextBlock
  answers: MultipleChoiceAnswer[]
}

interface MultipleChoiceAnswer {
  text: Text
  isCorrect: boolean
}

interface TextBlock {
  type: 'text-block'
  children: Paragraph[]
}

interface Paragraph {
  type: 'paragraph'
  content: Text
}

interface Text {
  type: 'text'
  text: string
}
