import './App.css'

const defaultContent: Content = {
  type: 'content',
  children: [
    {
      type: 'content',
      children: [
        {
          type: 'paragraph',
          text: 'Welcome! This is a short introduction to Rsbuild and React.',
        },
        {
          type: 'paragraph',
          text: 'An example of a multiple-choice exercise:',
        },
      ],
    },
    {
      type: 'mutiple-choice-exercise',
      question: {
        type: 'content',
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

export default function App() {
  return (
    <main className="prose p-10">
      <h1>Rsbuild with React</h1>
      <p>Start building amazing things with Rsbuild.</p>
    </main>
  )
}

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
  type: 'content'
  children: Paragraph[]
}

interface Paragraph {
  type: 'paragraph'
  text: string
}
