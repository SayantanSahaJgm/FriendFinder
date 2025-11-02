const nodeFetch = require('node-fetch') as any
const { createServer } = require('http')
const supertest = require('supertest') as any

// This is a light integration test that will call the verification API handler using Next's request shape
// It stubs verifyFace and checks that the route returns the signed token and success

describe('Verification API', () => {
  test('POST /api/random-chat/verify returns signed token', async () => {
    // We directly import the handler file and call POST
    const handler = require('@/app/api/random-chat/verify/route').POST

    const fakeReq = {
      json: async () => ({ sessionId: 'session_test_1', anonymousId: 'Anon1', photoDataUri: 'data:image/jpeg;base64,AAA' }),
    }

    const res = await handler(fakeReq)
    expect(res).toBeDefined()
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('signedToken')
  })
})
