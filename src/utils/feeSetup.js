const FUND_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'Others'];

const deriveTotalFee = (feeSetup) => {
  const storedTotal = Number(feeSetup?.totalFee || 0);
  if (storedTotal > 0) {
    return storedTotal;
  }

  const allocations = Array.isArray(feeSetup?.fundAllocations) ? feeSetup.fundAllocations : [];
  const derivedTotal = allocations.reduce((sum, allocation) => sum + Number(allocation?.amount || 0), 0);
  return Number(derivedTotal.toFixed(2));
};

const buildFeeSetup = (totalFee, fundPercentages, updatedBy) => {
  const parsedTotalFee = Number(totalFee);
  const primaryPercentages = fundPercentages.slice(0, 8).map((value) => Number(value || 0));
  const primaryAllocations = FUND_NAMES.slice(0, 8).map((fundName, index) => {
    const percentage = Number(primaryPercentages[index] || 0);
    const amount = Number(((parsedTotalFee * percentage) / 100).toFixed(2));

    return { fundName, percentage, amount };
  });

  const primaryTotal = primaryAllocations.reduce((sum, allocation) => sum + allocation.amount, 0);
  const derivedOthersAmount = Number(Math.max(parsedTotalFee - primaryTotal, 0).toFixed(2));
  const derivedOthersPercentage = parsedTotalFee
    ? Number(((derivedOthersAmount / parsedTotalFee) * 100).toFixed(2))
    : 0;

  return {
    totalFee: parsedTotalFee,
    fundAllocations: [
      ...primaryAllocations,
      {
        fundName: 'Others',
        percentage: derivedOthersPercentage,
        amount: derivedOthersAmount,
      },
    ],
    updatedBy,
    updatedAt: new Date(),
  };
};

const normalizeFeeSetup = (feeSetup) => {
  if (!feeSetup) return feeSetup;

  const totalFee = deriveTotalFee(feeSetup);
  const allocations = Array.isArray(feeSetup.fundAllocations) ? feeSetup.fundAllocations : [];
  const byName = new Map(allocations.map((allocation) => [allocation.fundName, allocation]));

  const primaryAllocations = FUND_NAMES.slice(0, 8).map((fundName) => {
    const allocation = byName.get(fundName);
    const percentage = Number(allocation?.percentage || 0);
    const amount = Number(allocation?.amount ?? ((totalFee * percentage) / 100).toFixed(2));

    return { fundName, percentage, amount };
  });

  const explicitOthers = byName.get('Others');
  const primaryTotal = primaryAllocations.reduce((sum, allocation) => sum + allocation.amount, 0);
  const derivedOthersAmount = Number(Math.max(totalFee - primaryTotal, 0).toFixed(2));
  const derivedOthersPercentage = totalFee ? Number(((derivedOthersAmount / totalFee) * 100).toFixed(2)) : 0;

  return {
    ...feeSetup,
    totalFee,
    fundAllocations: [
      ...primaryAllocations,
      { fundName: 'Others', percentage: derivedOthersPercentage, amount: derivedOthersAmount },
    ],
  };
};

module.exports = { FUND_NAMES, buildFeeSetup, normalizeFeeSetup, deriveTotalFee };