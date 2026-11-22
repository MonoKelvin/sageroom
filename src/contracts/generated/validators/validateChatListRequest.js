import { t as require_ucs2length } from "./ucs2length.js";
// generated/raw-validators/validateChatListRequest.js
var validateChatListRequest = validate132;
var func2 = require_ucs2length().default;
var pattern4 = /* @__PURE__ */ new RegExp("^(0|[1-9][0-9]*)$", "u");
function validate132(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate132.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.limit === void 0 && (missing0 = "limit")) {
				validate132.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "after_seq" || key0 === "around_seq" || key0 === "before_seq" || key0 === "data_generation_id" || key0 === "limit")) {
					validate132.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.after_seq !== void 0) {
						let data0 = data.after_seq;
						const _errs2 = errors;
						const _errs3 = errors;
						let valid1 = false;
						const _errs4 = errors;
						if (errors === errors) {
							if (typeof data0 === "string") {
								if (func2(data0) > 19) {
									const err0 = {
										instancePath: instancePath + "/after_seq",
										schemaPath: "#/$defs/DecimalString/maxLength",
										keyword: "maxLength",
										params: { limit: 19 },
										message: "must NOT have more than 19 characters"
									};
									if (vErrors === null) vErrors = [err0];
									else vErrors.push(err0);
									errors++;
								} else if (!pattern4.test(data0)) {
									const err1 = {
										instancePath: instancePath + "/after_seq",
										schemaPath: "#/$defs/DecimalString/pattern",
										keyword: "pattern",
										params: { pattern: "^(0|[1-9][0-9]*)$" },
										message: "must match pattern \"^(0|[1-9][0-9]*)$\""
									};
									if (vErrors === null) vErrors = [err1];
									else vErrors.push(err1);
									errors++;
								}
							} else {
								const err2 = {
									instancePath: instancePath + "/after_seq",
									schemaPath: "#/$defs/DecimalString/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								};
								if (vErrors === null) vErrors = [err2];
								else vErrors.push(err2);
								errors++;
							}
						}
						var _valid0 = _errs4 === errors;
						valid1 = valid1 || _valid0;
						const _errs7 = errors;
						if (data0 !== null) {
							const err3 = {
								instancePath: instancePath + "/after_seq",
								schemaPath: "#/properties/after_seq/anyOf/1/type",
								keyword: "type",
								params: { type: "null" },
								message: "must be null"
							};
							if (vErrors === null) vErrors = [err3];
							else vErrors.push(err3);
							errors++;
						}
						var _valid0 = _errs7 === errors;
						valid1 = valid1 || _valid0;
						if (!valid1) {
							const err4 = {
								instancePath: instancePath + "/after_seq",
								schemaPath: "#/properties/after_seq/anyOf",
								keyword: "anyOf",
								params: {},
								message: "must match a schema in anyOf"
							};
							if (vErrors === null) vErrors = [err4];
							else vErrors.push(err4);
							errors++;
							validate132.errors = vErrors;
							return false;
						} else {
							errors = _errs3;
							if (vErrors !== null) {
								if (_errs3) vErrors.length = _errs3;
								else vErrors = null;
							}
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.around_seq !== void 0) {
							let data1 = data.around_seq;
							const _errs9 = errors;
							const _errs10 = errors;
							let valid3 = false;
							const _errs11 = errors;
							if (errors === errors) {
								if (typeof data1 === "string") {
									if (func2(data1) > 19) {
										const err5 = {
											instancePath: instancePath + "/around_seq",
											schemaPath: "#/$defs/DecimalString/maxLength",
											keyword: "maxLength",
											params: { limit: 19 },
											message: "must NOT have more than 19 characters"
										};
										if (vErrors === null) vErrors = [err5];
										else vErrors.push(err5);
										errors++;
									} else if (!pattern4.test(data1)) {
										const err6 = {
											instancePath: instancePath + "/around_seq",
											schemaPath: "#/$defs/DecimalString/pattern",
											keyword: "pattern",
											params: { pattern: "^(0|[1-9][0-9]*)$" },
											message: "must match pattern \"^(0|[1-9][0-9]*)$\""
										};
										if (vErrors === null) vErrors = [err6];
										else vErrors.push(err6);
										errors++;
									}
								} else {
									const err7 = {
										instancePath: instancePath + "/around_seq",
										schemaPath: "#/$defs/DecimalString/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									};
									if (vErrors === null) vErrors = [err7];
									else vErrors.push(err7);
									errors++;
								}
							}
							var _valid1 = _errs11 === errors;
							valid3 = valid3 || _valid1;
							const _errs14 = errors;
							if (data1 !== null) {
								const err8 = {
									instancePath: instancePath + "/around_seq",
									schemaPath: "#/properties/around_seq/anyOf/1/type",
									keyword: "type",
									params: { type: "null" },
									message: "must be null"
								};
								if (vErrors === null) vErrors = [err8];
								else vErrors.push(err8);
								errors++;
							}
							var _valid1 = _errs14 === errors;
							valid3 = valid3 || _valid1;
							if (!valid3) {
								const err9 = {
									instancePath: instancePath + "/around_seq",
									schemaPath: "#/properties/around_seq/anyOf",
									keyword: "anyOf",
									params: {},
									message: "must match a schema in anyOf"
								};
								if (vErrors === null) vErrors = [err9];
								else vErrors.push(err9);
								errors++;
								validate132.errors = vErrors;
								return false;
							} else {
								errors = _errs10;
								if (vErrors !== null) {
									if (_errs10) vErrors.length = _errs10;
									else vErrors = null;
								}
							}
							var valid0 = _errs9 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.before_seq !== void 0) {
								let data2 = data.before_seq;
								const _errs16 = errors;
								const _errs17 = errors;
								let valid5 = false;
								const _errs18 = errors;
								if (errors === errors) {
									if (typeof data2 === "string") {
										if (func2(data2) > 19) {
											const err10 = {
												instancePath: instancePath + "/before_seq",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											};
											if (vErrors === null) vErrors = [err10];
											else vErrors.push(err10);
											errors++;
										} else if (!pattern4.test(data2)) {
											const err11 = {
												instancePath: instancePath + "/before_seq",
												schemaPath: "#/$defs/DecimalString/pattern",
												keyword: "pattern",
												params: { pattern: "^(0|[1-9][0-9]*)$" },
												message: "must match pattern \"^(0|[1-9][0-9]*)$\""
											};
											if (vErrors === null) vErrors = [err11];
											else vErrors.push(err11);
											errors++;
										}
									} else {
										const err12 = {
											instancePath: instancePath + "/before_seq",
											schemaPath: "#/$defs/DecimalString/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										};
										if (vErrors === null) vErrors = [err12];
										else vErrors.push(err12);
										errors++;
									}
								}
								var _valid2 = _errs18 === errors;
								valid5 = valid5 || _valid2;
								const _errs21 = errors;
								if (data2 !== null) {
									const err13 = {
										instancePath: instancePath + "/before_seq",
										schemaPath: "#/properties/before_seq/anyOf/1/type",
										keyword: "type",
										params: { type: "null" },
										message: "must be null"
									};
									if (vErrors === null) vErrors = [err13];
									else vErrors.push(err13);
									errors++;
								}
								var _valid2 = _errs21 === errors;
								valid5 = valid5 || _valid2;
								if (!valid5) {
									const err14 = {
										instancePath: instancePath + "/before_seq",
										schemaPath: "#/properties/before_seq/anyOf",
										keyword: "anyOf",
										params: {},
										message: "must match a schema in anyOf"
									};
									if (vErrors === null) vErrors = [err14];
									else vErrors.push(err14);
									errors++;
									validate132.errors = vErrors;
									return false;
								} else {
									errors = _errs17;
									if (vErrors !== null) {
										if (_errs17) vErrors.length = _errs17;
										else vErrors = null;
									}
								}
								var valid0 = _errs16 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.data_generation_id !== void 0) {
									const _errs23 = errors;
									if (typeof data.data_generation_id !== "string") {
										validate132.errors = [{
											instancePath: instancePath + "/data_generation_id",
											schemaPath: "#/properties/data_generation_id/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid0 = _errs23 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.limit !== void 0) {
										let data4 = data.limit;
										const _errs25 = errors;
										if (!(typeof data4 == "number" && !(data4 % 1) && !isNaN(data4) && isFinite(data4))) {
											validate132.errors = [{
												instancePath: instancePath + "/limit",
												schemaPath: "#/properties/limit/type",
												keyword: "type",
												params: { type: "integer" },
												message: "must be integer"
											}];
											return false;
										}
										if (errors === _errs25) {
											if (typeof data4 == "number" && isFinite(data4)) {
												if (data4 > 200 || isNaN(data4)) {
													validate132.errors = [{
														instancePath: instancePath + "/limit",
														schemaPath: "#/properties/limit/maximum",
														keyword: "maximum",
														params: {
															comparison: "<=",
															limit: 200
														},
														message: "must be <= 200"
													}];
													return false;
												} else if (data4 < 1 || isNaN(data4)) {
													validate132.errors = [{
														instancePath: instancePath + "/limit",
														schemaPath: "#/properties/limit/minimum",
														keyword: "minimum",
														params: {
															comparison: ">=",
															limit: 1
														},
														message: "must be >= 1"
													}];
													return false;
												}
											}
										}
										var valid0 = _errs25 === errors;
									} else var valid0 = true;
								}
							}
						}
					}
				}
			}
		} else {
			validate132.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate132.errors = vErrors;
	return errors === 0;
}
validate132.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateChatListRequest };
