import './App.css'

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
