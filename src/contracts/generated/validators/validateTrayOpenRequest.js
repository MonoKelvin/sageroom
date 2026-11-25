import { t as require_ucs2length } from "./ucs2length.js";
// generated/raw-validators/validateTrayOpenRequest.js
var validateTrayOpenRequest = validate452;
var func2 = require_ucs2length().default;
var pattern4 = /* @__PURE__ */ new RegExp("^(0|[1-9][0-9]*)$", "u");
function validate452(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate452.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.conversation_id === void 0 && (missing0 = "conversation_id")) {
				validate452.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "conversation_id" || key0 === "data_generation_id" || key0 === "through_seq")) {
					validate452.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.conversation_id !== void 0) {
						const _errs2 = errors;
						if (typeof data.conversation_id !== "string") {
							validate452.errors = [{
								instancePath: instancePath + "/conversation_id",
								schemaPath: "#/properties/conversation_id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = _errs2 === errors;
					} else var valid0 = true;
					if (valid0) {
						if (data.data_generation_id !== void 0) {
							const _errs4 = errors;
							if (typeof data.data_generation_id !== "string") {
								validate452.errors = [{
									instancePath: instancePath + "/data_generation_id",
									schemaPath: "#/properties/data_generation_id/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = _errs4 === errors;
						} else var valid0 = true;
						if (valid0) {
							if (data.through_seq !== void 0) {
								let data2 = data.through_seq;
								const _errs6 = errors;
								const _errs7 = errors;
								let valid1 = false;
								const _errs8 = errors;
								if (errors === errors) {
									if (typeof data2 === "string") {
										if (func2(data2) > 19) {
											const err0 = {
												instancePath: instancePath + "/through_seq",
												schemaPath: "#/$defs/DecimalString/maxLength",
												keyword: "maxLength",
												params: { limit: 19 },
												message: "must NOT have more than 19 characters"
											};
											if (vErrors === null) vErrors = [err0];
											else vErrors.push(err0);
											errors++;
										} else if (!pattern4.test(data2)) {
											const err1 = {
												instancePath: instancePath + "/through_seq",
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
											instancePath: instancePath + "/through_seq",
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
								var _valid0 = _errs8 === errors;
								valid1 = valid1 || _valid0;
								const _errs11 = errors;
								if (data2 !== null) {
									const err3 = {
										instancePath: instancePath + "/through_seq",
										schemaPath: "#/properties/through_seq/anyOf/1/type",
										keyword: "type",
										params: { type: "null" },
										message: "must be null"
									};
									if (vErrors === null) vErrors = [err3];
									else vErrors.push(err3);
									errors++;
								}
								var _valid0 = _errs11 === errors;
								valid1 = valid1 || _valid0;
								if (!valid1) {
									const err4 = {
										instancePath: instancePath + "/through_seq",
										schemaPath: "#/properties/through_seq/anyOf",
										keyword: "anyOf",
										params: {},
										message: "must match a schema in anyOf"
									};
									if (vErrors === null) vErrors = [err4];
									else vErrors.push(err4);
									errors++;
									validate452.errors = vErrors;
									return false;
								} else {
									errors = _errs7;
									if (vErrors !== null) {
										if (_errs7) vErrors.length = _errs7;
										else vErrors = null;
									}
								}
								var valid0 = _errs6 === errors;
							} else var valid0 = true;
						}
					}
				}
			}
		} else {
			validate452.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate452.errors = vErrors;
	return errors === 0;
}
validate452.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateTrayOpenRequest };
