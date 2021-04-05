import {Command, flags} from '@oclif/command'
import axios from 'axios'
import {orderBy} from 'lodash'
const asciichart = require('asciichart')
const Table = require('cli-table3')
const {URLSearchParams} = require('url')

interface RolloutDataNode {
  date: Date;
  cumVaccinationFirstDoseUptakeByPublishDatePercentage: number;
  cumVaccinationSecondDoseUptakeByPublishDatePercentage: number;
  newPeopleVaccinatedFirstDoseByPublishDate: number;
  newPeopleVaccinatedSecondDoseByPublishDate: number;
}

class UkCovidStats extends Command {
  static flags = {
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    graph: flags.boolean({char: 'g', default: false}),
    'all-time': flags.boolean({char: 'a', default: false}),
  }

  async run() {
    const {flags} = this.parse(UkCovidStats)

    const baseUrl = 'https://coronavirus.data.gov.uk/api/v1/data'
    const structure = {
      areaType: 'areaType',
      areaName: 'areaName',
      areaCode: 'areaCode',
      date: 'date',
      newPeopleVaccinatedFirstDoseByPublishDate: 'newPeopleVaccinatedFirstDoseByPublishDate',
      newPeopleVaccinatedSecondDoseByPublishDate: 'newPeopleVaccinatedSecondDoseByPublishDate',
      cumVaccinationFirstDoseUptakeByPublishDatePercentage: 'cumVaccinationFirstDoseUptakeByPublishDatePercentage',
      cumVaccinationSecondDoseUptakeByPublishDatePercentage: 'cumVaccinationSecondDoseUptakeByPublishDatePercentage',
    }

    const params = {
      filters: 'areaName=United%2520Kingdom;areaType=overview&',
      structure: JSON.stringify(structure),
      format: 'json',
    }

    const response = await axios.get(`${baseUrl}?${new URLSearchParams(params).toString()}`)
    const rolloutData: RolloutDataNode[] = orderBy(response.data.data, ['date', 'asc'])

    let limitedRolloutData

    if (flags['all-time']) {
      limitedRolloutData = rolloutData
    } else {
      limitedRolloutData = rolloutData.slice(Math.max(rolloutData.length - 7, 1))
    }

    const rolloutTable = new Table({
      head: ['Date', 'First Dose %', 'Second Dose %', 'First Doses #', 'Second Doses #', 'Total Doses #'],
      colWidths: [15, 15, 16],
    })

    limitedRolloutData.forEach(row => {
      rolloutTable.push([
        row.date,
        row.cumVaccinationFirstDoseUptakeByPublishDatePercentage.toFixed(1),
        row.cumVaccinationSecondDoseUptakeByPublishDatePercentage.toFixed(1),
        row.newPeopleVaccinatedFirstDoseByPublishDate || 0,
        row.newPeopleVaccinatedSecondDoseByPublishDate || 0,
        row.newPeopleVaccinatedFirstDoseByPublishDate + row.newPeopleVaccinatedSecondDoseByPublishDate,
      ])
    })

    this.log('')
    this.log(rolloutTable.toString())

    if (flags.graph) {
      const firstDoseChart = new Array(limitedRolloutData.length)
      const secondDoseChart = new Array(limitedRolloutData.length)

      limitedRolloutData.forEach((row, index: number) => {
        firstDoseChart[index] = row.cumVaccinationFirstDoseUptakeByPublishDatePercentage
        secondDoseChart[index] = row.cumVaccinationSecondDoseUptakeByPublishDatePercentage
      })

      this.log('')
      this.log('Dose %')
      this.log('- 1st Dose: Blue')
      this.log('- 2nd Dose: Green')
      this.log('')

      const config = {
        colors: [
          asciichart.blue,
          asciichart.green,
        ],
      }

      this.log(asciichart.plot([firstDoseChart, secondDoseChart], config))
    }
  }
}

export = UkCovidStats
