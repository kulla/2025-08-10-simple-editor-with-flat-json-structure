import './App.css'

const defaultContent: Content = {
  type: 'content',
  children: [
    {
      type: 'text',
      children: [
        { type: 'paragraph', text: 'Welcome! This is a simple editor' },
        {
          type: 'paragraph',
          text: 'An example of a multiple-choice exercise:',
        },
      ],
    },
    {
      type: 'mutiple-choice-exercise',
      question: {
        type: 'text',
        children: [
          { type: 'paragraph', text: 'What is React primarily used for?' },
        ],
      },
      answers: [
        {
          text: { type: 'paragraph', text: 'Building user interfaces' },
          isCorrect: true,
        },
        {
          text: { type: 'paragraph', text: 'Managing databases' },
          isCorrect: false,
        },
        {
          text: { type: 'paragraph', text: 'Writing server-side code' },
          isCorrect: false,
        },
      ],
    },
  ],
}

function render(element: Element, key?: React.Key) {
  switch (element.type) {
    case 'content':
      return renderContent(element as Content, key)
    case 'mutiple-choice-exercise':
      return renderMultipleChoiceQuestion(element as MutipleChoiceExercise, key)
    case 'text':
      return renderText(element as Text, key)
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

function renderText(text: Text, key?: React.Key) {
  return (
    <div key={key}>
      {text.children.map((p, idx) => renderParagraph(p, idx))}
    </div>
  )
}

function renderParagraph(paragraph: Paragraph, key?: React.Key) {
  return <p key={key}>{paragraph.text}</p>
}

function renderMultipleChoiceQuestion(
  exercise: MutipleChoiceExercise,
  key?: React.Key,
) {
  return (
    <div key={key} className="card bg-info-content">
      <div className="card-body">
        <h2 className="card-title">Multiple Choice Question</h2>
        <div>{renderText(exercise.question)}</div>
        <ul className="list-none pl-0">
          {exercise.answers.map((answer, idx) => (
            <li key={idx.toString()} className="flex items-center gap-4">
              <input type="checkbox" className="checkbox" />
              {render(answer.text, idx)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <main className="prose p-10">
      <h1>Editor:</h1>
      {renderContent(defaultContent)}
    </main>
  )
}

type Element = Content | MutipleChoiceExercise | Text | Paragraph

interface Content {
  type: 'content'
  children: (Text | MutipleChoiceExercise)[]
}

interface MutipleChoiceExercise {
  type: 'mutiple-choice-exercise'
  question: Text
  answers: MultipleChoiceAnswer[]
}

interface MultipleChoiceAnswer {
  text: Paragraph
  isCorrect: boolean
}

interface Text {
  type: 'text'
  children: Paragraph[]
}

interface Paragraph {
  type: 'paragraph'
  text: string
}
