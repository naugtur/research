require('ses');

const FERAL_FUNCTION = Function;
repairIntrinsics({
  errorTaming: 'unsafe',
  stackFiltering: 'verbose',
  localeTaming: 'unsafe',
  overrideTaming: 'severe',
  regExpTaming: 'unsafe',
});

// retain the original Function constructor, we just want to freeze intrinsics
Function = FERAL_FUNCTION;

hardenIntrinsics();