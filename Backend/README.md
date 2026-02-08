# API Contract

## GET /health
Response:
{ "status": "Backend running " }

## POST /transactions
Request:
{
  "amount": number,
  "text": string
}

Response:
{
  "message": "Transaction saved",
  "data": {
    "id": number,
    "amount": string,
    "text": string,
    "category": string,
    "created_at": string
  }
}

## GET /transactions
Response:
[
  {
    "id": number,
    "amount": string,
    "text": string,
    "category": string,
    "created_at": string
  }
]
