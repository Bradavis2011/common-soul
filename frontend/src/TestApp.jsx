function TestApp() {
  return (
    <div style={{ padding: '20px', fontSize: '24px', color: 'red' }}>
      <h1>TEST - React is Working!</h1>
      <p>If you see this, React is loading correctly.</p>
      <p>Current time: {new Date().toLocaleString()}</p>
    </div>
  )
}

export default TestApp