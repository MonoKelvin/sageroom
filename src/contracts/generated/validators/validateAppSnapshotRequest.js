import { t as require_ucs2length } from "./ucs2length.js";
// generated/raw-validators/validateAppSnapshotRequest.js
var validateAppSnapshotRequest = validate77;
var schema101 = {
	"$defs": { "DecimalString": {
		"maxLength": 19,
		"pattern": "^(0|[1-9][0-9]*)$",
		"type": "string"
	} },
	"$schema": "https://json-schema.org/draft/2020-12/schema",
	"additionalProperties": false,
	"properties": {
		"data_generation_id": {
			"default": null,
			"type": ["string", "null"]
		},
		"last_event_seq": {
			"anyOf": [{ "$ref": "#/$defs/DecimalString" }, { "type": "null" }],
			"default": null
		}
	},
	"title": "AppSnapshotRequest",
	"type": "object"
};
var func2 = require_ucs2length().default;
var pattern4 = /* @__PURE__ */ new RegExp("^(0|[1-9][0-9]*)$", "u");
function validate77(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate77.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			const _errs1 = errors;
			for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "last_event_seq")) {
				validate77.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (_errs1 === errors) {
				if (data.data_generation_id !== void 0) {
					let data0 = data.data_generation_id;
					const _errs2 = errors;
					if (typeof data0 !== "string" && data0 !== null) {
						validate77.errors = [{
							instancePath: instancePath + "/data_generation_id",
							schemaPath: "#/properties/data_generation_id/type",
							keyword: "type",
							params: { type: schema101.properties.data_generation_id.type },
							message: "must be string,null"
						}];
						return false;
					}
					var valid0 = _errs2 === errors;
				} else var valid0 = true;
				if (valid0) {
					if (data.last_event_seq !== void 0) {
						let data1 = data.last_event_seq;
						const _errs4 = errors;
						const _errs5 = errors;
						let valid1 = false;
						const _errs6 = errors;
						if (errors === errors) {
							if (typeof data1 === "string") {
								if (func2(data1) > 19) {
									const err0 = {
										instancePath: instancePath + "/last_event_seq",
										schemaPath: "#/$defs/DecimalString/maxLength",
										keyword: "maxLength",
										params: { limit: 19 },
										message: "must NOT have more than 19 characters"
									};
									if (vErrors === null) vErrors = [err0];
									else vErrors.push(err0);
									errors++;
								} else if (!pattern4.test(data1)) {
									const err1 = {
										instancePath: instancePath + "/last_event_seq",
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
									instancePath: instancePath + "/last_event_seq",
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
						var _valid0 = _errs6 === errors;
						valid1 = valid1 || _valid0;
						const _errs9 = errors;
						if (data1 !== null) {
							const err3 = {
								instancePath: instancePath + "/last_event_seq",
								schemaPath: "#/properties/last_event_seq/anyOf/1/type",
								keyword: "type",
								params: { type: "null" },
								message: "must be null"
							};
							if (vErrors === null) vErrors = [err3];
							else vErrors.push(err3);
							errors++;
						}
						var _valid0 = _errs9 === errors;
						valid1 = valid1 || _valid0;
						if (!valid1) {
							const err4 = {
								instancePath: instancePath + "/last_event_seq",
								schemaPath: "#/properties/last_event_seq/anyOf",
								keyword: "anyOf",
								params: {},
								message: "must match a schema in anyOf"
							};
							if (vErrors === null) vErrors = [err4];
							else vErrors.push(err4);
							errors++;
							validate77.errors = vErrors;
							return false;
						} else {
							errors = _errs5;
							if (vErrors !== null) {
								if (_errs5) vErrors.length = _errs5;
								else vErrors = null;
							}
						}
						var valid0 = _errs4 === errors;
					} else var valid0 = true;
				}
			}
		} else {
			validate77.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate77.errors = vErrors;
	return errors === 0;
}
validate77.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateAppSnapshotRequest };
