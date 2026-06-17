#!/bin/bash
# ARRIS API Test Script
# Run: bash test_api.sh

BASE="http://localhost:8000/api/v1"

echo ""
echo "=== 1. HEALTH CHECK ==="
curl -s $BASE/health | python -m json.tool

echo ""
echo "=== 2. REGISTER ==="
curl -s -X POST $BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@arris.dev","password":"Password@123","first_name":"Test","last_name":"Admin","organization_id":"a1000000-0000-0000-0000-000000000001"}' | python -m json.tool

echo ""
echo "=== 3. LOGIN ==="
LOGIN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@arris.dev&password=Password@123")
echo $LOGIN | python -m json.tool

TOKEN=$(echo $LOGIN | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "Login failed — cannot continue. Check server logs."
  exit 1
fi

echo ""
echo "TOKEN acquired: ${TOKEN:0:40}..."

echo ""
echo "=== 4. MY PROFILE ==="
curl -s $BASE/users/me \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool

echo ""
echo "=== 5. LIST USERS ==="
curl -s "$BASE/users?page=1&page_size=5" \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool

echo ""
echo "=== 6. LIST ROLES ==="
curl -s $BASE/roles \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool

echo ""
echo "=== 7. MY ORGANIZATION ==="
curl -s $BASE/tenants/organization/me \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool

echo ""
echo "=== 8. CREATE LEAD ==="
LEAD=$(curl -s -X POST $BASE/leads \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customer_name":"Rahul Mehta","phone_number":"+91-9876543210","email":"rahul@example.com","lead_source":"Website","budget_range":"50L-1Cr","lead_status":"New"}')
echo $LEAD | python -m json.tool

LEAD_ID=$(echo $LEAD | python -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)

echo ""
echo "=== 9. LIST LEADS ==="
curl -s "$BASE/leads?page=1&page_size=5" \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool

if [ ! -z "$LEAD_ID" ]; then
  echo ""
  echo "=== 10. ADD FOLLOW-UP (lead: $LEAD_ID) ==="
  curl -s -X POST $BASE/leads/$LEAD_ID/follow-ups \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"followup_date":"2026-06-20T10:00:00Z","followup_type":"Call","notes":"Initial contact","next_action":"Send brochure"}' | python -m json.tool

  echo ""
  echo "=== 11. LEAD ACTIVITY TIMELINE ==="
  curl -s $BASE/leads/$LEAD_ID/activity \
    -H "Authorization: Bearer $TOKEN" | python -m json.tool
fi

echo ""
echo "=== 12. LIST PROJECTS ==="
curl -s "$BASE/projects?page=1&page_size=5" \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool

echo ""
echo "=== 13. CREATE PROJECT ==="
PROJECT=$(curl -s -X POST $BASE/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"project_name":"Test Tower","project_type":"Apartment","project_status":"Upcoming","location":"MG Road","city":"Bengaluru","state":"Karnataka","total_units":50}')
echo $PROJECT | python -m json.tool
PROJECT_ID=$(echo $PROJECT | python -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)

if [ ! -z "$PROJECT_ID" ]; then
  echo ""
  echo "=== 14. CREATE UNIT ==="
  UNIT=$(curl -s -X POST $BASE/units \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"project_id\":\"$PROJECT_ID\",\"unit_number\":\"T-101\",\"unit_type\":\"Apartment\",\"unit_size\":1100,\"size_unit\":\"sqft\",\"floor_number\":1,\"base_price\":6500000,\"offer_price\":6825000}")
  echo $UNIT | python -m json.tool
  UNIT_ID=$(echo $UNIT | python -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)

  echo ""
  echo "=== 15. PROJECT UNITS ==="
  curl -s "$BASE/projects/$PROJECT_ID/units" \
    -H "Authorization: Bearer $TOKEN" | python -m json.tool

  if [ ! -z "$UNIT_ID" ]; then
    echo ""
    echo "=== 16. CREATE BOOKING ==="
    BOOKING=$(curl -s -X POST $BASE/bookings \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"unit_id\":\"$UNIT_ID\",\"project_id\":\"$PROJECT_ID\",\"customer_name\":\"Vikram Singh\",\"phone_number\":\"+91-9988776655\",\"unit_price\":6825000,\"booking_status\":\"Confirmed\"}")
    echo $BOOKING | python -m json.tool
    BOOKING_ID=$(echo $BOOKING | python -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)

    if [ ! -z "$BOOKING_ID" ]; then
      echo ""
      echo "=== 17. LIST BOOKINGS ==="
      curl -s "$BASE/bookings?page=1&page_size=5" \
        -H "Authorization: Bearer $TOKEN" | python -m json.tool

      echo ""
      echo "=== 18. PAYMENT PLAN ==="
      curl -s -X POST $BASE/bookings/$BOOKING_ID/payment-plan \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"plan_name\":\"50-50 Plan\",\"installment_count\":2,\"total_amount\":6825000,\"installments\":[{\"installment_number\":1,\"due_date\":\"2026-07-01\",\"amount\":3412500},{\"installment_number\":2,\"due_date\":\"2026-12-01\",\"amount\":3412500}]}" | python -m json.tool

      echo ""
      echo "=== 19. RECORD PAYMENT ==="
      curl -s -X POST $BASE/payments \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"booking_id\":\"$BOOKING_ID\",\"payment_amount\":500000,\"payment_date\":\"2026-06-12\",\"payment_mode\":\"BankTransfer\",\"payment_status\":\"Completed\"}" | python -m json.tool

      echo ""
      echo "=== 20. LIST PAYMENTS ==="
      curl -s "$BASE/payments?page=1&page_size=5" \
        -H "Authorization: Bearer $TOKEN" | python -m json.tool
    fi
  fi
fi

echo ""
echo "=== DONE ==="
