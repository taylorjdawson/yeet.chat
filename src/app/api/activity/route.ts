export async function POST(request: Request) {
  const res = await request.json()
  console.log("POST: ", JSON.stringify(res, null, 2))
  return Response.json({ res })
}
