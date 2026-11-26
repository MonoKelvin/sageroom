import { t as require_ucs2length } from "./ucs2length.js";
// generated/raw-validators/validateAttachmentPasteRequest.js
var validateAttachmentPasteRequest = validate133;
var func2 = require_ucs2length().default;
function validate133(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate133.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.file_name === void 0 && (missing0 = "file_name") || data.data_base64 === void 0 && (missing0 = "data_base64")) {
			validate133.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "data_base64" || key0 === "data_generation_id" || key0 === "file_name")) {
				validate133.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.data_base64 !== void 0) {
				let data0 = data.data_base64;
				if (typeof data0 === "string") {
					if (func2(data0) > 36e6) {
						validate133.errors = [{
							instancePath: instancePath + "/data_base64",
							schemaPath: "#/properties/data_base64/maxLength",
							keyword: "maxLength",
							params: { limit: 36e6 },
							message: "must NOT have more than 36000000 characters"
						}];
						return false;
					} else if (func2(data0) < 1) {
						validate133.errors = [{
							instancePath: instancePath + "/data_base64",
							schemaPath: "#/properties/data_base64/minLength",
							keyword: "minLength",
							params: { limit: 1 },
							message: "must NOT have fewer than 1 characters"
						}];
						return false;
					}
				} else {
					validate133.errors = [{
						instancePath: instancePath + "/data_base64",
						schemaPath: "#/properties/data_base64/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.data_generation_id !== void 0) {
					if (typeof data.data_generation_id !== "string") {
						validate133.errors = [{
							instancePath: instancePath + "/data_generation_id",
							schemaPath: "#/properties/data_generation_id/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.file_name !== void 0) {
						if (typeof data.file_name !== "string") {
							validate133.errors = [{
								instancePath: instancePath + "/file_name",
								schemaPath: "#/properties/file_name/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
				}
			}
		}
	} else {
		validate133.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate133.errors = vErrors;
	return true;
}
validate133.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateAttachmentPasteRequest };
