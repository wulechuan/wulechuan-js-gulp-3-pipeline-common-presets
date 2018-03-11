module.exports = buildAPipelineForBuildingOneAppOrOnePage;

/*
*
*
*
*
*
*
* ****************************************
*           任务集工厂函数；工具
* ****************************************
*/

const pathTool = require('path');
const deleteFiles = require('del');

const gulp = require('gulp');

// const chalk = require('chalk');

const { join: joinPath } = pathTool;
const { sync: deleteFilesSync } = deleteFiles;

const getValidatedGlobsFrom             = require('../utilities/_generic/get-validated-globs');
const printInfoAboutTheCompletionOfTask = require('../utilities/_generic/print-one-task-done');
const createTaskForCopyingFiles         = require('../gulp-task-creators/_generic-copy-files');

const { namePrefixOfEveryAutoGeneratedTask } = require('../configurations');


function buildAPipelineForBuildingOneAppOrOnePage({ // eslint-disable-line max-statements
	// logging
	pipelineCategory,                           // e.g. 'Javascript' or '爪哇脚本'
	taskNameKeyPart,                            // e.g. 'Page: User Dashboard' or maybe just 'App'
	basePathForShorteningPathsInLog = '',       // e.g. 'front-end/source/js' or 'front-end/source', anything you like.

	// source
	sourceBasePath = process.pwd(),             // e.g. 'front-end/source/js'
	buildingEntryGlobsRelativeToSourceBasePath, // e.g. [ '**/*.js' ]
	watchingBasePath,
	watchingGlobsRelativeToWatchingBasePath,    // e.g. [ '**/*.js' ]

	// building
	outputBasePathOfBuilding,                   // e.g. '../static' or 'dist/assets'
	builtGlobsRelativeToOutputBasePathOfBuilding = [],

	// A function to create another function,
	// the created function will be used
	// as the task body of building process upon source globs.
	toCreateBuildingTaskBody,

	// copying
	shouldCopyBuiltFileToElsewhere = false,
	outputBasePathOfCopying, // e.g. 'build/tryout-website/assets'
	optionsOfCopyingFiles,   // will be passed to **createTaskForCopyingFiles**
}) {
	if (! buildingEntryGlobsRelativeToSourceBasePath) {
		if (watchingBasePath || watchingGlobsRelativeToWatchingBasePath) {
			throw Error('Why do we have settings for watching globs but NOT those for source globs?');
		}
	}

	if (! watchingBasePath) {
		watchingBasePath = sourceBasePath;
	}




	const validatedGlobsRelativeToSourcebasePath = getValidatedGlobsFrom({
		rawGlobs: buildingEntryGlobsRelativeToSourceBasePath,
		defaultValue: [ '**/*' ],
	});

	if (! watchingGlobsRelativeToWatchingBasePath) {
		watchingGlobsRelativeToWatchingBasePath = validatedGlobsRelativeToSourcebasePath;
	}

	const validatedBuiltRelativeGlobs = getValidatedGlobsFrom({
		rawGlobs: builtGlobsRelativeToOutputBasePathOfBuilding,
		defaultValue: [ '**/*' ],
	});





	const resolvedPathsOfEntryGlobsForBuilding = validatedGlobsRelativeToSourcebasePath.map(
		glob => joinPath(sourceBasePath, glob)
	);

	const resolvedPathsOfBuiltGlobs = validatedBuiltRelativeGlobs.map(
		glob => joinPath(outputBasePathOfBuilding, glob)
	);

	let resolvedPathsOfGlobsToDeleteBeforeEachBuild = [
		...resolvedPathsOfBuiltGlobs,
	];





	let resolvedPathsOfGlobsToCopyAfterEachBuild;
	let resolvedPathsOfCopiesOfBuiltGlobs;

	if (shouldCopyBuiltFileToElsewhere) {
		resolvedPathsOfGlobsToCopyAfterEachBuild = [
			...resolvedPathsOfBuiltGlobs,
		];

		resolvedPathsOfCopiesOfBuiltGlobs = [
			...validatedBuiltRelativeGlobs.map(
				glob => joinPath(outputBasePathOfCopying, glob)
			),
		];

		resolvedPathsOfGlobsToDeleteBeforeEachBuild = [
			...resolvedPathsOfGlobsToDeleteBeforeEachBuild,
			...resolvedPathsOfCopiesOfBuiltGlobs,
		];
	}







	const pipelineFullName = `${taskNameKeyPart} - ${pipelineCategory}`;

	const taskPrintingNameOfDeletingFiles                          = `${pipelineFullName}: Delete old files`;
	const taskPrintingNameOfBuilding                               = `${pipelineFullName}: Delete old files and then build`;
	const taskPrintingNameOfDeletingOldOutputFilesAndThenBuilding  = `${pipelineFullName}: Build`;
	const taskPrintingNameOfCopyingFiles                           = `${pipelineFullName}: Copy built output files`;
	const taskPrintingNameOfBuildingAndThenCopyingBuiltOutputFiles = `${pipelineFullName}: Build and then copy built output files`;

	const taskNameOfDeletingFiles                          = `${namePrefixOfEveryAutoGeneratedTask} - ${taskPrintingNameOfDeletingFiles}`;
	const taskNameOfDeletingFilesWithoutPrinting           = `${namePrefixOfEveryAutoGeneratedTask} - ${taskPrintingNameOfDeletingFiles} (without printing completion info)`;
	const taskNameOfBuilding                               = `${namePrefixOfEveryAutoGeneratedTask} - ${taskPrintingNameOfBuilding}`;
	const taskNameOfDeletingOldOutputFilesAndThenBuilding  = `${namePrefixOfEveryAutoGeneratedTask} - ${taskPrintingNameOfDeletingOldOutputFilesAndThenBuilding}`;
	const taskNameOfCopyingFiles                           = `${namePrefixOfEveryAutoGeneratedTask} - ${taskPrintingNameOfCopyingFiles}`;
	const taskNameOfBuildingAndThenCopyingBuiltOutputFiles = `${namePrefixOfEveryAutoGeneratedTask} - ${taskPrintingNameOfBuildingAndThenCopyingBuiltOutputFiles}`;

	let taskNameOfMainTask;
	if (shouldCopyBuiltFileToElsewhere) {
		taskNameOfMainTask = taskNameOfBuildingAndThenCopyingBuiltOutputFiles;
	} else {
		taskNameOfMainTask = taskNameOfDeletingOldOutputFilesAndThenBuilding;
	}





	const taskBodyOfDeletingFilesWithoutPrinting = (thisTaskIsDone) => {
		deleteFilesSync(resolvedPathsOfGlobsToDeleteBeforeEachBuild, {
			force: true, // force 为 true，是为了删除位于 npm 项目文件夹之外的文件。
		});
		thisTaskIsDone();
	};

	const taskBodyOfDeletingFiles = (thisTaskIsDone) => {
		deleteFilesSync(resolvedPathsOfGlobsToDeleteBeforeEachBuild, {
			force: true, // force 为 true，是为了删除位于 npm 项目文件夹之外的文件。
		});
		printInfoAboutTheCompletionOfTask(taskPrintingNameOfDeletingFiles, false);
		thisTaskIsDone();
	};

	const taskBodyOfBuilding = toCreateBuildingTaskBody({
		taskNameKeyPart,
		entryGlobsForBuilding: resolvedPathsOfEntryGlobsForBuilding,
		outputBasePathOfBuilding,
		basePathForShorteningPathsInLog,
	});



	// VERY, VERY UGLY IMPEMENTATION BELOW.
	// To be improved in the future.
	const taskBodyOfDeletingOldOutputFilesAndThenBuilding = (thisActionIsDone) => {
		taskBodyOfDeletingFilesWithoutPrinting(() => {
			taskBodyOfBuilding(
				thisActionIsDone
			);
		});
	};
	// const taskBodyOfDeletingOldOutputFilesAndThenBuilding = (thisTaskIsDone) => {
	// 	runTasksSequentially(
	// 		taskNameOfDeletingFilesWithoutPrinting,
	// 		taskNameOfBuilding
	// 	)(thisTaskIsDone);
	// };




	let taskBodyOfCopyingFiles;
	let taskBodyOfBuildingAndThenCopyingBuiltOutputFiles;

	if (shouldCopyBuiltFileToElsewhere) {
		const usedOptionsOfCopyingFiles = {
			...{
				shouldFlattenSubFolders: false,
				logPrefix: taskNameOfCopyingFiles,
				shouldNotLogDetails: true,
				shouldListSourceFiles: false,
			},

			...optionsOfCopyingFiles,
		};

		taskBodyOfCopyingFiles = createTaskForCopyingFiles(
			resolvedPathsOfGlobsToCopyAfterEachBuild,
			outputBasePathOfCopying,
			usedOptionsOfCopyingFiles
		);



		// VERY, VERY UGLY IMPEMENTATION BELOW.
		// To be improved in the future.
		taskBodyOfBuildingAndThenCopyingBuiltOutputFiles = (thisActionIsDone) => {
			taskBodyOfDeletingFilesWithoutPrinting(() => {
				taskBodyOfBuilding(() => {
					taskBodyOfCopyingFiles(
						thisActionIsDone
					);
				});
			});
		};
		// taskBodyOfBuildingAndThenCopyingBuiltOutputFiles = (thisTaskIsDone) => {
		// 	runTasksSequentially(
		// 		taskNameOfDeletingFilesWithoutPrinting,
		// 		taskNameOfBuilding,
		// 		taskNameOfCopyingFiles
		// 	)(thisTaskIsDone);
		// };
	}





	let actionToTakeOnSourceFilesChange;
	if (shouldCopyBuiltFileToElsewhere) {
		actionToTakeOnSourceFilesChange = taskBodyOfBuildingAndThenCopyingBuiltOutputFiles;
	} else {
		actionToTakeOnSourceFilesChange = taskBodyOfDeletingOldOutputFilesAndThenBuilding;
	}







	gulp.task(
		taskNameOfDeletingFiles,
		taskBodyOfDeletingFiles
	);
	gulp.task(
		taskNameOfDeletingFilesWithoutPrinting,
		taskBodyOfDeletingFilesWithoutPrinting
	);
	gulp.task(
		taskNameOfBuilding,
		taskBodyOfBuilding
	);
	gulp.task(
		taskNameOfDeletingOldOutputFilesAndThenBuilding,
		taskBodyOfDeletingOldOutputFilesAndThenBuilding
	);

	if (shouldCopyBuiltFileToElsewhere) {
		gulp.task(
			taskNameOfCopyingFiles,
			taskBodyOfCopyingFiles
		);
		gulp.task(
			taskNameOfBuildingAndThenCopyingBuiltOutputFiles,
			taskBodyOfBuildingAndThenCopyingBuiltOutputFiles
		);
	}





	const pipelineSettings = {
		// logging
		pipelineFullName,

		// globs of pipeline
		resolvedPathsOfEntryGlobsForBuilding,
		resolvedPathsOfBuiltGlobs,
		resolvedPathsOfGlobsToDeleteBeforeEachBuild,

		// globs for watching
		watchingBasePath,
		watchingGlobsRelativeToWatchingBasePath,

		// task names
		taskNameOfMainTask,
		taskNameOfDeletingFiles,          // 或可用于完整清除所有构建输出的任务
		taskNameOfBuilding: taskNameOfDeletingOldOutputFilesAndThenBuilding,

		// task bodies
		toClean: taskBodyOfDeletingFiles,
		toBuild: taskBodyOfDeletingOldOutputFilesAndThenBuilding, // 或可用于一次性编译或构建任务

		actionToTakeOnSourceFilesChange,  // 显然，这是针对【文件变动监测机制】的
	};


	if (shouldCopyBuiltFileToElsewhere) {
		pipelineSettings.resolvedPathsOfGlobsToCopyAfterEachBuild = resolvedPathsOfGlobsToCopyAfterEachBuild;
		pipelineSettings.resolvedPathsOfCopiesOfBuiltGlobs        = resolvedPathsOfCopiesOfBuiltGlobs;
		pipelineSettings.taskNameOfBuildingAndThenCopying         = taskNameOfBuildingAndThenCopyingBuiltOutputFiles;
	}





	return pipelineSettings;
}