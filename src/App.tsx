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

export default function App() {
  const { state, storage } = useStateStorage(defaultContent)

  return (
    <main className="prose p-10">
      <h1>Editor:</h1>
      {renderContent(defaultContent)}
      <h2>State:</h2>
      <pre className="bg-base-200 p-4 rounded-lg">
        {JSON.stringify(state, null, 2)}
      </pre>
      <h2>Entries:</h2>
      <ul className="list-none pl-0">
        {storage.getEntries().map(([key, entry]) => (
          <li key={key} className="mb-2">
            <strong>{key}:</strong> {JSON.stringify(entry.value)}
          </li>
        ))}
      </ul>
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
