// helpers/getStudentMetaData.js

const Group = require("../models/StudentGroup");
const Proposal = require("../models/StudentProposal");

/**
 * @param {Object} data
 * @param {String} data.email   (optional)
 * @param {String} data.sapId   (optional)
 * 
 * @returns {Object} { group, proposal }
 */
const getStudentMetaData = async (data) => {
  let group = null;
  let proposal = null;

  try {
    /* =======================
       STEP 1: GROUP BY EMAIL
    ======================= */
    if (data?.email) {
      group = await Group.findOne({
        $or: [
          { "leader.email": data.email },
          { "member2.email": data.email },
          { "member3.email": data.email }
        ]
      });
    }

    /* =======================
       STEP 2: GROUP BY SAP ID
       (if email not found)
    ======================= */
    if (!group && data?.sapId) {
      group = await Group.findOne({
        $or: [
          { "leader.sapId": data.sapId },
          { "member2.sapId": data.sapId },
          { "member3.sapId": data.sapId }
        ]
      });
    }

    /* =======================
       STEP 3: PROPOSAL CHECK
    ======================= */
    if (group) {
      proposal = await Proposal.findOne({
        groupId: group._id
      });
    }

    /* =======================
       SAFE RETURN (NEVER BREAKS)
    ======================= */
    return {
      group: group || null,
      proposal: proposal || null
    };

  } catch (error) {
    // function kabhi fail nahi karega
    console.error("getStudentMetaData error:", error.message);

    return {
      group: null,
      proposal: null
    };
  }
};

module.exports = getStudentMetaData;
