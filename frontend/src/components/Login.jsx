
import axios from 'axios'

export default function Login() {
  const login = async () => {
    await axios.post('http://127.0.0.1:8000/auth/register', {
      email: 'client@test.com',
      password: '1234',
      role: 'client'
    })
    alert('User Registered')
  }

  return <button onClick={login}>Register Client</button>
}
