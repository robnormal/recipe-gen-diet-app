import request from 'supertest';
import app from '../index';

describe('GET /api/health', () => {
  it('should return 200 status code and correct JSON response', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toEqual({
      status: 'ok',
      message: 'Backend API is running'
    });
  });
});
