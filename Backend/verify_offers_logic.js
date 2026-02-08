
import 'dotenv/config';
import pool from './db.js';

async function verifyLogic() {
  try {
    const amount = 100;
    const category = "Dining & Restaurants";
    const merchant = "Swiggy Dineout";
    // We simulate that the backend has fetched the user's cards.
    // Since we updated the DB, 'HDFC PayZapp' should now be 'HDFC'.
    // So we test if matching works with 'HDFC'.
    const userBanks = ["HDFC", "ICICI"];
    const userCardNames = ["Regalia", "Coral", "Any"];

    console.log("Testing SQL logic with:", { category, merchant, userBanks, amount });

    const query = `
      SELECT *
      FROM card_offers
      WHERE
        $1 >= min_amount
        AND (
          category ILIKE '%' || $2 || '%'
          -- Add aliases for common categories
          OR (
            ($2 ILIKE '%Food%' AND (category ILIKE '%Dining%' OR category ILIKE '%Restaurant%'))
            OR ($2 ILIKE '%Dining%' AND category ILIKE '%Food%')
            OR ($2 ILIKE '%Utility%' AND category ILIKE '%Bill%')
            OR ($2 ILIKE '%Bill%' AND category ILIKE '%Utility%')
            OR ($2 ILIKE '%Shopping%' AND category ILIKE '%Shop%')
          )
        )
        AND (
          merchant ILIKE '%' || $3 || '%'
          OR $3 ILIKE '%' || merchant || '%'
          -- Generic / Wildcard matches
          OR merchant ILIKE '%All%'
          OR merchant ILIKE '%Partner%'
          OR merchant ILIKE '%General%'
          OR merchant ILIKE '%Any%'
          OR (merchant ILIKE '%Offline%' AND $3 ILIKE '%Walk-in%')
        )
        AND (
          bank = ANY($4)
          OR bank = 'Any'
          OR bank IS NULL
        )
        AND (
          card_name IS NULL 
          OR card_name = ''
          OR card_name = ANY($5)
        )
      `;

    const res = await pool.query(query, [amount, category, merchant, userBanks, userCardNames]);

    console.log(`Found ${res.rows.length} matches.`);
    res.rows.forEach(r => {
      console.log(`- Offer: ${r.offer_id} | Cat: ${r.category} | Merch: ${r.merchant} | Bank: ${r.bank} | Min: ${r.min_amount}`);
    });

    await pool.end();

  } catch (e) {
    console.error(e);
    await pool.end();
  }
}

verifyLogic();
