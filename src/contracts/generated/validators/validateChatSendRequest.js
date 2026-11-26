// generated/raw-validators/validateChatSendRequest.js
var validateChatSendRequest = validate264;
var schema330 = {
	"$defs": {
		"AttachmentKind": {
			"enum": ["image", "file"],
			"type": "string"
		},
		"AttachmentObject": {
			"additionalProperties": false,
			"description": "消息附件。图片会带上原始宽高，界面据此预留占位，避免加载后跳动。",
			"properties": {
				"byte_size": {
					"format": "uint32",
					"minimum": 0,
					"type": "integer"
				},
				"file_name": { "type": "string" },
				"height": {
					"format": "uint32",
					"minimum": 0,
					"type": ["integer", "null"]
				},
				"id": { "type": "string" },
				"kind": { "$ref": "#/$defs/AttachmentKind" },
				"mime_type": { "type": "string" },
				"width": {
					"format": "uint32",
					"minimum": 0,
					"type": ["integer", "null"]
				}
			},
			"required": [
				"id",
				"file_name",
				"mime_type",
				"byte_size",
				"kind"
			],
			"type": "object"
		},
		"MessagePart": { "oneOf": [
			{
				"additionalProperties": false,
				"properties": {
					"kind": {
						"const": "text",
						"type": "string"
					},
					"text": { "type": "string" }
				},
				"required": ["kind", "text"],
				"type": "object"
			},
			{
				"additionalProperties": false,
				"properties": {
					"attachment": { "$ref": "#/$defs/AttachmentObject" },
					"kind": {
						"const": "attachment",
						"type": "string"
					}
				},
				"required": ["kind", "attachment"],
				"type": "object"
			},
			{
				"additionalProperties": false,
				"properties": {
					"emote_id": { "type": "string" },
					"kind": {
						"const": "emote",
						"type": "string"
					}
				},
				"required": ["kind", "emote_id"],
				"type": "object"
			}
		] }
	},
	"$schema": "https://json-schema.org/draft/2020-12/schema",
	"additionalProperties": false,
	"properties": {
		"client_request_id": { "type": "string" },
		"data_generation_id": { "type": "string" },
		"mention_all": { "type": "boolean" },
		"mention_ids": {
			"items": { "type": "string" },
			"type": "array"
		},
		"parts": {
			"items": { "$ref": "#/$defs/MessagePart" },
			"type": "array"
		},
		"quote_message_id": {
			"default": null,
			"type": ["string", "null"]
		}
	},
	"required": [
		"data_generation_id",
		"client_request_id",
		"parts",
		"mention_ids",
		"mention_all"
	],
	"title": "ChatSendRequest",
	"type": "object"
};
var schema332 = {
	"additionalProperties": false,
	"description": "消息附件。图片会带上原始宽高，界面据此预留占位，避免加载后跳动。",
	"properties": {
		"byte_size": {
			"format": "uint32",
			"minimum": 0,
			"type": "integer"
		},
		"file_name": { "type": "string" },
		"height": {
			"format": "uint32",
			"minimum": 0,
			"type": ["integer", "null"]
		},
		"id": { "type": "string" },
		"kind": { "$ref": "#/$defs/AttachmentKind" },
		"mime_type": { "type": "string" },
		"width": {
			"format": "uint32",
			"minimum": 0,
			"type": ["integer", "null"]
		}
	},
	"required": [
		"id",
		"file_name",
		"mime_type",
		"byte_size",
		"kind"
	],
	"type": "object"
};
var schema333 = {
	"enum": ["image", "file"],
	"type": "string"
};
function validate266(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate266.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.id === void 0 && (missing0 = "id") || data.file_name === void 0 && (missing0 = "file_name") || data.mime_type === void 0 && (missing0 = "mime_type") || data.byte_size === void 0 && (missing0 = "byte_size") || data.kind === void 0 && (missing0 = "kind")) {
			validate266.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "byte_size" || key0 === "file_name" || key0 === "height" || key0 === "id" || key0 === "kind" || key0 === "mime_type" || key0 === "width")) {
				validate266.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.byte_size !== void 0) {
				let data0 = data.byte_size;
				if (!(typeof data0 == "number" && !(data0 % 1) && !isNaN(data0) && isFinite(data0))) {
					validate266.errors = [{
						instancePath: instancePath + "/byte_size",
						schemaPath: "#/properties/byte_size/type",
						keyword: "type",
						params: { type: "integer" },
						message: "must be integer"
					}];
					return false;
				}
				if (typeof data0 == "number" && isFinite(data0)) {
					if (data0 < 0 || isNaN(data0)) {
						validate266.errors = [{
							instancePath: instancePath + "/byte_size",
							schemaPath: "#/properties/byte_size/minimum",
							keyword: "minimum",
							params: {
								comparison: ">=",
								limit: 0
							},
							message: "must be >= 0"
						}];
						return false;
					}
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.file_name !== void 0) {
					if (typeof data.file_name !== "string") {
						validate266.errors = [{
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
				if (valid0) {
					if (data.height !== void 0) {
						let data2 = data.height;
						if (!(typeof data2 == "number" && !(data2 % 1) && !isNaN(data2) && isFinite(data2)) && data2 !== null) {
							validate266.errors = [{
								instancePath: instancePath + "/height",
								schemaPath: "#/properties/height/type",
								keyword: "type",
								params: { type: schema332.properties.height.type },
								message: "must be integer,null"
							}];
							return false;
						}
						if (typeof data2 == "number" && isFinite(data2)) {
							if (data2 < 0 || isNaN(data2)) {
								validate266.errors = [{
									instancePath: instancePath + "/height",
									schemaPath: "#/properties/height/minimum",
									keyword: "minimum",
									params: {
										comparison: ">=",
										limit: 0
									},
									message: "must be >= 0"
								}];
								return false;
							}
						}
						var valid0 = true;
					} else var valid0 = true;
					if (valid0) {
						if (data.id !== void 0) {
							if (typeof data.id !== "string") {
								validate266.errors = [{
									instancePath: instancePath + "/id",
									schemaPath: "#/properties/id/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.kind !== void 0) {
								let data4 = data.kind;
								if (typeof data4 !== "string") {
									validate266.errors = [{
										instancePath: instancePath + "/kind",
										schemaPath: "#/$defs/AttachmentKind/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								if (!(data4 === "image" || data4 === "file")) {
									validate266.errors = [{
										instancePath: instancePath + "/kind",
										schemaPath: "#/$defs/AttachmentKind/enum",
										keyword: "enum",
										params: { allowedValues: schema333.enum },
										message: "must be equal to one of the allowed values"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.mime_type !== void 0) {
									if (typeof data.mime_type !== "string") {
										validate266.errors = [{
											instancePath: instancePath + "/mime_type",
											schemaPath: "#/properties/mime_type/type",
											keyword: "type",
											params: { type: "string" },
											message: "must be string"
										}];
										return false;
									}
									var valid0 = true;
								} else var valid0 = true;
								if (valid0) {
									if (data.width !== void 0) {
										let data6 = data.width;
										if (!(typeof data6 == "number" && !(data6 % 1) && !isNaN(data6) && isFinite(data6)) && data6 !== null) {
											validate266.errors = [{
												instancePath: instancePath + "/width",
												schemaPath: "#/properties/width/type",
												keyword: "type",
												params: { type: schema332.properties.width.type },
												message: "must be integer,null"
											}];
											return false;
										}
										if (typeof data6 == "number" && isFinite(data6)) {
											if (data6 < 0 || isNaN(data6)) {
												validate266.errors = [{
													instancePath: instancePath + "/width",
													schemaPath: "#/properties/width/minimum",
													keyword: "minimum",
													params: {
														comparison: ">=",
														limit: 0
													},
													message: "must be >= 0"
												}];
												return false;
											}
										}
										var valid0 = true;
									} else var valid0 = true;
								}
							}
						}
					}
				}
			}
		}
	} else {
		validate266.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate266.errors = vErrors;
	return true;
}
validate266.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
function validate265(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate265.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	const _errs0 = errors;
	let valid0 = false;
	let passing0 = null;
	const _errs1 = errors;
	if (errors === _errs1) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.kind === void 0 && (missing0 = "kind") || data.text === void 0 && (missing0 = "text")) {
				const err0 = {
					instancePath,
					schemaPath: "#/oneOf/0/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				};
				if (vErrors === null) vErrors = [err0];
				else vErrors.push(err0);
				errors++;
			} else {
				const _errs3 = errors;
				for (const key0 in data) if (!(key0 === "kind" || key0 === "text")) {
					const err1 = {
						instancePath,
						schemaPath: "#/oneOf/0/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					};
					if (vErrors === null) vErrors = [err1];
					else vErrors.push(err1);
					errors++;
					break;
				}
				if (_errs3 === errors) {
					if (data.kind !== void 0) {
						let data0 = data.kind;
						const _errs4 = errors;
						if (typeof data0 !== "string") {
							const err2 = {
								instancePath: instancePath + "/kind",
								schemaPath: "#/oneOf/0/properties/kind/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							};
							if (vErrors === null) vErrors = [err2];
							else vErrors.push(err2);
							errors++;
						}
						if ("text" !== data0) {
							const err3 = {
								instancePath: instancePath + "/kind",
								schemaPath: "#/oneOf/0/properties/kind/const",
								keyword: "const",
								params: { allowedValue: "text" },
								message: "must be equal to constant"
							};
							if (vErrors === null) vErrors = [err3];
							else vErrors.push(err3);
							errors++;
						}
						var valid1 = _errs4 === errors;
					} else var valid1 = true;
					if (valid1) {
						if (data.text !== void 0) {
							const _errs6 = errors;
							if (typeof data.text !== "string") {
								const err4 = {
									instancePath: instancePath + "/text",
									schemaPath: "#/oneOf/0/properties/text/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								};
								if (vErrors === null) vErrors = [err4];
								else vErrors.push(err4);
								errors++;
							}
							var valid1 = _errs6 === errors;
						} else var valid1 = true;
					}
				}
			}
		} else {
			const err5 = {
				instancePath,
				schemaPath: "#/oneOf/0/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			};
			if (vErrors === null) vErrors = [err5];
			else vErrors.push(err5);
			errors++;
		}
	}
	var _valid0 = _errs1 === errors;
	if (_valid0) {
		valid0 = true;
		passing0 = 0;
		var props0 = true;
	}
	const _errs8 = errors;
	if (errors === _errs8) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing1;
			if (data.kind === void 0 && (missing1 = "kind") || data.attachment === void 0 && (missing1 = "attachment")) {
				const err6 = {
					instancePath,
					schemaPath: "#/oneOf/1/required",
					keyword: "required",
					params: { missingProperty: missing1 },
					message: "must have required property '" + missing1 + "'"
				};
				if (vErrors === null) vErrors = [err6];
				else vErrors.push(err6);
				errors++;
			} else {
				const _errs10 = errors;
				for (const key1 in data) if (!(key1 === "attachment" || key1 === "kind")) {
					const err7 = {
						instancePath,
						schemaPath: "#/oneOf/1/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key1 },
						message: "must NOT have additional properties"
					};
					if (vErrors === null) vErrors = [err7];
					else vErrors.push(err7);
					errors++;
					break;
				}
				if (_errs10 === errors) {
					if (data.attachment !== void 0) {
						const _errs11 = errors;
						if (!validate266(data.attachment, {
							instancePath: instancePath + "/attachment",
							parentData: data,
							parentDataProperty: "attachment",
							rootData,
							dynamicAnchors
						})) {
							vErrors = vErrors === null ? validate266.errors : vErrors.concat(validate266.errors);
							errors = vErrors.length;
						}
						var valid2 = _errs11 === errors;
					} else var valid2 = true;
					if (valid2) {
						if (data.kind !== void 0) {
							let data3 = data.kind;
							const _errs12 = errors;
							if (typeof data3 !== "string") {
								const err8 = {
									instancePath: instancePath + "/kind",
									schemaPath: "#/oneOf/1/properties/kind/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								};
								if (vErrors === null) vErrors = [err8];
								else vErrors.push(err8);
								errors++;
							}
							if ("attachment" !== data3) {
								const err9 = {
									instancePath: instancePath + "/kind",
									schemaPath: "#/oneOf/1/properties/kind/const",
									keyword: "const",
									params: { allowedValue: "attachment" },
									message: "must be equal to constant"
								};
								if (vErrors === null) vErrors = [err9];
								else vErrors.push(err9);
								errors++;
							}
							var valid2 = _errs12 === errors;
						} else var valid2 = true;
					}
				}
			}
		} else {
			const err10 = {
				instancePath,
				schemaPath: "#/oneOf/1/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			};
			if (vErrors === null) vErrors = [err10];
			else vErrors.push(err10);
			errors++;
		}
	}
	var _valid0 = _errs8 === errors;
	if (_valid0 && valid0) {
		valid0 = false;
		passing0 = [passing0, 1];
	} else {
		if (_valid0) {
			valid0 = true;
			passing0 = 1;
			if (props0 !== true) props0 = true;
		}
		const _errs14 = errors;
		if (errors === _errs14) {
			if (data && typeof data == "object" && !Array.isArray(data)) {
				let missing2;
				if (data.kind === void 0 && (missing2 = "kind") || data.emote_id === void 0 && (missing2 = "emote_id")) {
					const err11 = {
						instancePath,
						schemaPath: "#/oneOf/2/required",
						keyword: "required",
						params: { missingProperty: missing2 },
						message: "must have required property '" + missing2 + "'"
					};
					if (vErrors === null) vErrors = [err11];
					else vErrors.push(err11);
					errors++;
				} else {
					const _errs16 = errors;
					for (const key2 in data) if (!(key2 === "emote_id" || key2 === "kind")) {
						const err12 = {
							instancePath,
							schemaPath: "#/oneOf/2/additionalProperties",
							keyword: "additionalProperties",
							params: { additionalProperty: key2 },
							message: "must NOT have additional properties"
						};
						if (vErrors === null) vErrors = [err12];
						else vErrors.push(err12);
						errors++;
						break;
					}
					if (_errs16 === errors) {
						if (data.emote_id !== void 0) {
							const _errs17 = errors;
							if (typeof data.emote_id !== "string") {
								const err13 = {
									instancePath: instancePath + "/emote_id",
									schemaPath: "#/oneOf/2/properties/emote_id/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								};
								if (vErrors === null) vErrors = [err13];
								else vErrors.push(err13);
								errors++;
							}
							var valid3 = _errs17 === errors;
						} else var valid3 = true;
						if (valid3) {
							if (data.kind !== void 0) {
								let data5 = data.kind;
								const _errs19 = errors;
								if (typeof data5 !== "string") {
									const err14 = {
										instancePath: instancePath + "/kind",
										schemaPath: "#/oneOf/2/properties/kind/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									};
									if (vErrors === null) vErrors = [err14];
									else vErrors.push(err14);
									errors++;
								}
								if ("emote" !== data5) {
									const err15 = {
										instancePath: instancePath + "/kind",
										schemaPath: "#/oneOf/2/properties/kind/const",
										keyword: "const",
										params: { allowedValue: "emote" },
										message: "must be equal to constant"
									};
									if (vErrors === null) vErrors = [err15];
									else vErrors.push(err15);
									errors++;
								}
								var valid3 = _errs19 === errors;
							} else var valid3 = true;
						}
					}
				}
			} else {
				const err16 = {
					instancePath,
					schemaPath: "#/oneOf/2/type",
					keyword: "type",
					params: { type: "object" },
					message: "must be object"
				};
				if (vErrors === null) vErrors = [err16];
				else vErrors.push(err16);
				errors++;
			}
		}
		var _valid0 = _errs14 === errors;
		if (_valid0 && valid0) {
			valid0 = false;
			passing0 = [passing0, 2];
		} else if (_valid0) {
			valid0 = true;
			passing0 = 2;
			if (props0 !== true) props0 = true;
		}
	}
	if (!valid0) {
		const err17 = {
			instancePath,
			schemaPath: "#/oneOf",
			keyword: "oneOf",
			params: { passingSchemas: passing0 },
			message: "must match exactly one schema in oneOf"
		};
		if (vErrors === null) vErrors = [err17];
		else vErrors.push(err17);
		errors++;
		validate265.errors = vErrors;
		return false;
	} else {
		errors = _errs0;
		if (vErrors !== null) {
			if (_errs0) vErrors.length = _errs0;
			else vErrors = null;
		}
	}
	validate265.errors = vErrors;
	evaluated0.props = props0;
	return errors === 0;
}
validate265.evaluated = {
	"dynamicProps": true,
	"dynamicItems": false
};
function validate264(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	let errors = 0;
	const evaluated0 = validate264.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (errors === 0) {
		if (data && typeof data == "object" && !Array.isArray(data)) {
			let missing0;
			if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.client_request_id === void 0 && (missing0 = "client_request_id") || data.parts === void 0 && (missing0 = "parts") || data.mention_ids === void 0 && (missing0 = "mention_ids") || data.mention_all === void 0 && (missing0 = "mention_all")) {
				validate264.errors = [{
					instancePath,
					schemaPath: "#/required",
					keyword: "required",
					params: { missingProperty: missing0 },
					message: "must have required property '" + missing0 + "'"
				}];
				return false;
			} else {
				const _errs1 = errors;
				for (const key0 in data) if (!(key0 === "client_request_id" || key0 === "data_generation_id" || key0 === "mention_all" || key0 === "mention_ids" || key0 === "parts" || key0 === "quote_message_id")) {
					validate264.errors = [{
						instancePath,
						schemaPath: "#/additionalProperties",
						keyword: "additionalProperties",
						params: { additionalProperty: key0 },
						message: "must NOT have additional properties"
					}];
					return false;
				}
				if (_errs1 === errors) {
					if (data.client_request_id !== void 0) {
						const _errs2 = errors;
						if (typeof data.client_request_id !== "string") {
							validate264.errors = [{
								instancePath: instancePath + "/client_request_id",
								schemaPath: "#/properties/client_request_id/type",
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
								validate264.errors = [{
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
							if (data.mention_all !== void 0) {
								const _errs6 = errors;
								if (typeof data.mention_all !== "boolean") {
									validate264.errors = [{
										instancePath: instancePath + "/mention_all",
										schemaPath: "#/properties/mention_all/type",
										keyword: "type",
										params: { type: "boolean" },
										message: "must be boolean"
									}];
									return false;
								}
								var valid0 = _errs6 === errors;
							} else var valid0 = true;
							if (valid0) {
								if (data.mention_ids !== void 0) {
									let data3 = data.mention_ids;
									const _errs8 = errors;
									if (errors === _errs8) {
										if (Array.isArray(data3)) {
											const len0 = data3.length;
											for (let i0 = 0; i0 < len0; i0++) {
												const _errs10 = errors;
												if (typeof data3[i0] !== "string") {
													validate264.errors = [{
														instancePath: instancePath + "/mention_ids/" + i0,
														schemaPath: "#/properties/mention_ids/items/type",
														keyword: "type",
														params: { type: "string" },
														message: "must be string"
													}];
													return false;
												}
												if (!(_errs10 === errors)) break;
											}
										} else {
											validate264.errors = [{
												instancePath: instancePath + "/mention_ids",
												schemaPath: "#/properties/mention_ids/type",
												keyword: "type",
												params: { type: "array" },
												message: "must be array"
											}];
											return false;
										}
									}
									var valid0 = _errs8 === errors;
								} else var valid0 = true;
								if (valid0) {
									if (data.parts !== void 0) {
										let data5 = data.parts;
										const _errs12 = errors;
										if (errors === _errs12) {
											if (Array.isArray(data5)) {
												const len1 = data5.length;
												for (let i1 = 0; i1 < len1; i1++) {
													const _errs14 = errors;
													if (!validate265(data5[i1], {
														instancePath: instancePath + "/parts/" + i1,
														parentData: data5,
														parentDataProperty: i1,
														rootData,
														dynamicAnchors
													})) {
														vErrors = vErrors === null ? validate265.errors : vErrors.concat(validate265.errors);
														errors = vErrors.length;
													}
													if (!(_errs14 === errors)) break;
												}
											} else {
												validate264.errors = [{
													instancePath: instancePath + "/parts",
													schemaPath: "#/properties/parts/type",
													keyword: "type",
													params: { type: "array" },
													message: "must be array"
												}];
												return false;
											}
										}
										var valid0 = _errs12 === errors;
									} else var valid0 = true;
									if (valid0) {
										if (data.quote_message_id !== void 0) {
											let data7 = data.quote_message_id;
											const _errs15 = errors;
											if (typeof data7 !== "string" && data7 !== null) {
												validate264.errors = [{
													instancePath: instancePath + "/quote_message_id",
													schemaPath: "#/properties/quote_message_id/type",
													keyword: "type",
													params: { type: schema330.properties.quote_message_id.type },
													message: "must be string,null"
												}];
												return false;
											}
											var valid0 = _errs15 === errors;
										} else var valid0 = true;
									}
								}
							}
						}
					}
				}
			}
		} else {
			validate264.errors = [{
				instancePath,
				schemaPath: "#/type",
				keyword: "type",
				params: { type: "object" },
				message: "must be object"
			}];
			return false;
		}
	}
	validate264.errors = vErrors;
	return errors === 0;
}
validate264.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateChatSendRequest };
