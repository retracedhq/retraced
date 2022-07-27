import getPgPool from "../persistence/pg";

const safeQuery = async (query, args) => {
    try {
        const pool = await getPgPool();
        const result = await pool.query(query, args);
        return result;
    } catch (ex) {
        // console.log("[Safe Query Error]", query, args, ex);
        return null;
    }
};

export default safeQuery;
