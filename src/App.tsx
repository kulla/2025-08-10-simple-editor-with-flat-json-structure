import padStart from 'lodash/padStart'
import { useState } from 'react'
import ReactDOMServer from 'react-dom/server'
import { html as beautifyHtml } from 'js-beautify'
import './App.css'

import { useStateStorage } from './state'

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
  const [options, showOptions] = useState<Record<Option, boolean>>({
    state: true,
    entries: true,
    html: true,
  })
  const { state, storage } = useStateStorage(defaultContent)

  return (
    <main className="prose p-10">
      <div className="max-w-xl">
        <h1>Editor:</h1>
        {renderContent(defaultContent)}
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
        {options.state && (
          <pre className="max-w-xl h-132">{JSON.stringify(state, null, 2)}</pre>
        )}
        {options.entries && (
          <pre className="max-w-xl h-132">
            {storage
              .getEntries()
              .map(
                ([key, entry]) =>
                  `${padStart(key, 4)}: ${JSON.stringify(entry.value)}`,
              )
              .join('\n')}
          </pre>
        )}
        {options.html && (
          <pre className="max-w-xl h-132">
            {beautifyHtml(
              ReactDOMServer.renderToStaticMarkup(renderContent(state)),
              { indent_size: 2, wrap_line_length: 70 },
            )}
          </pre>
        )}
      </div>
    </main>
  )
}

function render(element: Element, key?: React.Key) {
  switch (element.type) {
    case 'content':
      return renderContent(element, key)
    case 'mutiple-choice-exercise':
      return renderMultipleChoiceQuestion(element, key)
    case 'text-block':
      return renderTextBlock(element, key)
    case 'text':
      return renderText(element, key)
    case 'paragraph':
      return renderParagraph(element as Paragraph, key)
    default:
      return null
  }
}

function renderContent(content: Content, key?: React.Key) {
  return (
    <section key={key} className="rounded-xl border-2 p-4">
      {content.children.map((child, idx) => render(child, idx))}
    </section>
  )
}

function renderMultipleChoiceQuestion(
  exercise: MutipleChoiceExercise,
  key?: React.Key,
) {
  return (
    <div key={key} className="card bg-info-content">
      <div className="card-body">
        <h2 className="card-title">Multiple Choice Question</h2>
        {renderTextBlock(exercise.question)}
        <ul className="list-none pl-0 mt-0">
          {exercise.answers.map((answer, idx) => (
            <li key={idx.toString()}>
              <input type="checkbox" className="checkbox mr-4" />
              {render(answer.text, idx)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function renderTextBlock(text: TextBlock, key?: React.Key) {
  return (
    <div key={key} className="text-block">
      {text.children.map((p, idx) => renderParagraph(p, idx))}
    </div>
  )
}

function renderParagraph(paragraph: Paragraph, key?: React.Key) {
  return <p key={key}>{render(paragraph.content)}</p>
}

function renderText(text: Text, key?: React.Key) {
  return <span key={key}>{text.text}</span>
}

type Element = Content | MutipleChoiceExercise | TextBlock | Paragraph | Text

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
